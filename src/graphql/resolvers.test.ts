import { describe, it, expect, vi } from "vitest";
import * as slots from "@/lib/slots";
import { graphql, type GraphQLError } from "graphql";
import { schema } from "@/graphql/schema";
import { prisma } from "@/lib/prisma";
import { createAppointment, createSlot, futureDate } from "@/test-support/factories";
import { devOutbox } from "@/lib/email/send";
import * as emailSend from "@/lib/email/send";
import type { GraphQLContext } from "@/graphql/context";

const DAY = 24 * 60 * 60_000;

const authed: GraphQLContext = {
  session: {
    user: { email: "johanna@kine-maxillo-lyon.com" },
    expires: futureDate(DAY).toISOString(),
  },
};
const anon: GraphQLContext = { session: null };

async function exec(
  source: string,
  variableValues: Record<string, unknown> = {},
  contextValue: GraphQLContext = anon
) {
  const result = await graphql({ schema, source, variableValues, contextValue });
  return result as typeof result & { errors?: readonly GraphQLError[] };
}

function firstErrorMessage(result: { errors?: readonly GraphQLError[] }): string | undefined {
  return result.errors?.[0]?.message;
}

describe("availableSlots (public)", () => {
  it("only returns slots for the requested category", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    await createSlot(futureDate(DAY + 60 * 60_000), "PRESSOTHERAPIE");

    const result = await exec(
      `query($category: Category!, $from: DateTime!, $to: DateTime!) {
        availableSlots(category: $category, from: $from, to: $to) { start }
      }`,
      { category: "MAXILLO_FACIAL", from: new Date().toISOString(), to: futureDate(2 * DAY).toISOString() }
    );

    expect(result.errors).toBeUndefined();
    const slots = result.data?.availableSlots as Array<{ start: Date }>;
    expect(slots.map((s) => new Date(s.start).getTime())).toEqual([start.getTime()]);
  });
});

describe("requestAppointment", () => {
  it("books an open slot, emails the confirmation link and never returns the tokens", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");

    const result = await exec(
      `mutation($input: RequestAppointmentInput!) {
        requestAppointment(input: $input) { appointment { id status category } }
      }`,
      {
        input: {
          slotStart: start.toISOString(),
          category: "PRESSOTHERAPIE",
          patientName: "Marie Curie",
          patientPhone: "0611111111",
          patientEmail: "marie@example.com",
        },
      }
    );

    expect(result.errors).toBeUndefined();
    const payload = result.data?.requestAppointment as {
      appointment: { id: string; status: string; category: string };
    };
    expect(payload.appointment.status).toBe("PENDING");
    expect(payload.appointment.category).toBe("PRESSOTHERAPIE");
    expect(JSON.stringify(result.data)).not.toMatch(/[0-9a-f]{64}/);

    const stored = await prisma.appointment.findUniqueOrThrow({ where: { id: payload.appointment.id } });
    expect(devOutbox).toHaveLength(1);
    expect(devOutbox[0].to).toBe("marie@example.com");
    expect(devOutbox[0].text).toContain(`/rendez-vous/confirmation?token=${stored.confirmationToken}`);
    expect(devOutbox[0].text).not.toContain(stored.cancellationToken);
  });

  it("rejects querying tokens on the request payload", async () => {
    const result = await exec(
      `mutation($input: RequestAppointmentInput!) {
        requestAppointment(input: $input) { confirmationToken }
      }`,
      { input: bookingInput(futureDate(DAY)) }
    );
    expect(result.errors?.[0]?.message).toMatch(/confirmationToken/);
  });

  it("rejects double-booking the same slot", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");
    await createAppointment({ slotStart: start, category: "PRESSOTHERAPIE", status: "PENDING" });

    const result = await exec(
      `mutation($input: RequestAppointmentInput!) {
        requestAppointment(input: $input) { appointment { id } }
      }`,
      {
        input: {
          slotStart: start.toISOString(),
          category: "PRESSOTHERAPIE",
          patientName: "Autre Patient",
          patientPhone: "0622222222",
          patientEmail: "autre@example.com",
        },
      }
    );

    expect(firstErrorMessage(result)).toMatch(/plus disponible/);
  });

  it("rejects booking a slot that doesn't exist", async () => {
    const result = await exec(
      `mutation($input: RequestAppointmentInput!) {
        requestAppointment(input: $input) { appointment { id } }
      }`,
      {
        input: {
          slotStart: futureDate(DAY).toISOString(),
          category: "MAXILLO_FACIAL",
          patientName: "Personne",
          patientPhone: "0600000000",
          patientEmail: "personne@example.com",
        },
      }
    );

    expect(firstErrorMessage(result)).toMatch(/plus disponible/);
  });
});

describe("confirmAppointment", () => {
  it("confirms a PENDING appointment and returns the cancellationToken", async () => {
    const start = futureDate(DAY);
    const appt = await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "PENDING" });

    const result = await exec(
      `mutation($token: String!) {
        confirmAppointment(token: $token) { appointment { status } cancellationToken }
      }`,
      { token: appt.confirmationToken }
    );

    expect(result.errors).toBeUndefined();
    const payload = result.data?.confirmAppointment as {
      appointment: { status: string };
      cancellationToken: string;
    };
    expect(payload.appointment.status).toBe("CONFIRMED");
    expect(payload.cancellationToken).toBe(appt.cancellationToken);
  });

  it("is idempotent: confirming an already-confirmed appointment succeeds again", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
    });

    const result = await exec(
      `mutation($token: String!) { confirmAppointment(token: $token) { appointment { status } } }`,
      { token: appt.confirmationToken }
    );

    expect(result.errors).toBeUndefined();
    expect((result.data?.confirmAppointment as { appointment: { status: string } }).appointment.status).toBe(
      "CONFIRMED"
    );
  });

  it("rejects an unknown token", async () => {
    const result = await exec(
      `mutation($token: String!) { confirmAppointment(token: $token) { appointment { status } } }`,
      { token: "does-not-exist" }
    );

    expect(firstErrorMessage(result)).toMatch(/invalide/);
  });

  it("rejects confirming a cancelled appointment", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CANCELLED",
    });

    const result = await exec(
      `mutation($token: String!) { confirmAppointment(token: $token) { appointment { status } } }`,
      { token: appt.confirmationToken }
    );

    expect(firstErrorMessage(result)).toMatch(/ne peut plus être confirmé/);
  });
});

describe("cancelAppointment", () => {
  it("cancels a CONFIRMED appointment and frees its slot", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    const appt = await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "CONFIRMED" });

    const result = await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { status } } }`,
      { token: appt.cancellationToken }
    );

    expect(result.errors).toBeUndefined();
    expect((result.data?.cancelAppointment as { appointment: { status: string } }).appointment.status).toBe(
      "CANCELLED"
    );

    const slots = await exec(
      `query($category: Category!, $from: DateTime!, $to: DateTime!) {
        availableSlots(category: $category, from: $from, to: $to) { start }
      }`,
      { category: "MAXILLO_FACIAL", from: new Date().toISOString(), to: futureDate(2 * DAY).toISOString() }
    );
    const freedSlots = slots.data?.availableSlots as Array<{ start: Date }>;
    expect(freedSlots.map((s) => new Date(s.start).getTime())).toEqual([start.getTime()]);
  });

  it("is idempotent: cancelling an already-cancelled appointment does not error", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CANCELLED",
    });

    const result = await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { status } } }`,
      { token: appt.cancellationToken }
    );

    expect(result.errors).toBeUndefined();
  });

  it("rejects an unknown token", async () => {
    const result = await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { status } } }`,
      { token: "does-not-exist" }
    );

    expect(firstErrorMessage(result)).toMatch(/invalide/);
  });
});

describe("admin operations require a session", () => {
  const cases: Array<{ name: string; source: string; variables?: Record<string, unknown> }> = [
    {
      name: "appointments",
      source: `query($from: DateTime!, $to: DateTime!) { appointments(from: $from, to: $to) { id } }`,
      variables: { from: new Date().toISOString(), to: futureDate(DAY).toISOString() },
    },
    {
      name: "availableSlotEntries",
      source: `query($from: DateTime!, $to: DateTime!) { availableSlotEntries(from: $from, to: $to) { id } }`,
      variables: { from: new Date().toISOString(), to: futureDate(DAY).toISOString() },
    },
    {
      name: "addAvailableSlot",
      source: `mutation($input: AddAvailableSlotInput!) { addAvailableSlot(input: $input) { id } }`,
      variables: { input: { start: futureDate(DAY).toISOString(), category: "MAXILLO_FACIAL" } },
    },
    {
      name: "deleteAvailableSlot",
      source: `mutation { deleteAvailableSlot(id: "nonexistent") }`,
    },
    {
      name: "cancelAppointmentAsAdmin",
      source: `mutation { cancelAppointmentAsAdmin(id: "nonexistent") { id } }`,
    },
  ];

  it.each(cases)("$name rejects an anonymous caller", async ({ source, variables }) => {
    const result = await exec(source, variables ?? {}, anon);
    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
  });
});

describe("addAvailableSlot (authenticated)", () => {
  it("creates a slot", async () => {
    const start = futureDate(DAY);
    const result = await exec(
      `mutation($input: AddAvailableSlotInput!) {
        addAvailableSlot(input: $input) { start category }
      }`,
      { input: { start: start.toISOString(), category: "MAXILLO_FACIAL" } },
      authed
    );

    expect(result.errors).toBeUndefined();
    const created = result.data?.addAvailableSlot as { start: Date; category: string };
    expect(new Date(created.start).getTime()).toBe(start.getTime());
    expect(created.category).toBe("MAXILLO_FACIAL");
  });

  it("rejects a duplicate (same start + category) with a friendly error", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");

    const result = await exec(
      `mutation($input: AddAvailableSlotInput!) { addAvailableSlot(input: $input) { id } }`,
      { input: { start: start.toISOString(), category: "MAXILLO_FACIAL" } },
      authed
    );

    expect(firstErrorMessage(result)).toMatch(/déjà ouvert/);
  });
});

describe("deleteAvailableSlot (authenticated)", () => {
  it("deletes an unbooked slot", async () => {
    const slot = await createSlot(futureDate(DAY), "PRESSOTHERAPIE");

    const result = await exec(
      `mutation($id: ID!) { deleteAvailableSlot(id: $id) }`,
      { id: slot.id },
      authed
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteAvailableSlot).toBe(true);
    expect(await prisma.availableSlot.findUnique({ where: { id: slot.id } })).toBeNull();
  });

  it("refuses to delete a slot covered by an active appointment", async () => {
    const start = futureDate(DAY);
    const slot = await createSlot(start, "PRESSOTHERAPIE");
    await createAppointment({ slotStart: start, category: "PRESSOTHERAPIE", status: "CONFIRMED" });

    const result = await exec(
      `mutation($id: ID!) { deleteAvailableSlot(id: $id) }`,
      { id: slot.id },
      authed
    );

    expect(firstErrorMessage(result)).toMatch(/réservé/);
    expect(await prisma.availableSlot.findUnique({ where: { id: slot.id } })).not.toBeNull();
  });
});

describe("availableSlotEntries booked flag", () => {
  it("reports booked:true only once an active appointment covers the slot", async () => {
    const start = futureDate(DAY);
    const slot = await createSlot(start, "MAXILLO_FACIAL");

    const before = await exec(
      `query($from: DateTime!, $to: DateTime!) {
        availableSlotEntries(from: $from, to: $to) { id booked }
      }`,
      { from: new Date().toISOString(), to: futureDate(2 * DAY).toISOString() },
      authed
    );
    expect(before.data?.availableSlotEntries).toEqual([{ id: slot.id, booked: false }]);

    await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "CONFIRMED" });

    const after = await exec(
      `query($from: DateTime!, $to: DateTime!) {
        availableSlotEntries(from: $from, to: $to) { id booked }
      }`,
      { from: new Date().toISOString(), to: futureDate(2 * DAY).toISOString() },
      authed
    );
    expect(after.data?.availableSlotEntries).toEqual([{ id: slot.id, booked: true }]);
  });
});

const REQUEST_MUTATION = `mutation($input: RequestAppointmentInput!) {
  requestAppointment(input: $input) { appointment { id } }
}`;

function bookingInput(start: Date, overrides: Record<string, unknown> = {}) {
  return {
    slotStart: start.toISOString(),
    category: "MAXILLO_FACIAL",
    patientName: "Marie Curie",
    patientPhone: "06 11 11 11 11",
    patientEmail: "marie@example.com",
    reason: "Rééducation maxillo-faciale — douleur ATM",
    ...overrides,
  };
}

describe("requestAppointment — sécurité", () => {
  it("maps a lost race (check passed, insert refused by the DB) to 'plus disponible'", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "PENDING" });
    // Simule la fenêtre de course : la vérification applicative ne voit pas
    // encore le RDV concurrent, seule la contrainte en base l'arrête.
    const spy = vi.spyOn(slots, "isSlotAvailable").mockResolvedValueOnce(true);

    const result = await exec(REQUEST_MUTATION, { input: bookingInput(start) });

    spy.mockRestore();
    expect(firstErrorMessage(result)).toBe("Ce créneau n'est plus disponible.");
    expect(await prisma.appointment.count()).toBe(1);
  });

  it("enforces the partial unique index at the database level", async () => {
    const start = futureDate(DAY);
    await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "CONFIRMED" });
    await expect(
      createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "PENDING" })
    ).rejects.toThrow();
    // Un RDV annulé/expiré ne bloque pas le créneau.
    await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "CANCELLED" });
    await createAppointment({ slotStart: start, category: "PRESSOTHERAPIE", status: "PENDING" });
  });

  it.each([
    ["empty name", { patientName: "   " }],
    ["invalid email", { patientEmail: "pas-un-email" }],
    ["invalid phone", { patientPhone: "appelez-moi" }],
    ["too short phone", { patientPhone: "0612" }],
    ["newline in name", { patientName: "Marie\nCurie" }],
    ["reason too long", { reason: "x".repeat(1001) }],
  ])("rejects %s with BAD_USER_INPUT and creates nothing", async (_, overrides) => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");

    const result = await exec(REQUEST_MUTATION, { input: bookingInput(start, overrides) });

    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("stores trimmed values, a lowercased email and null for an empty reason", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");

    const result = await exec(REQUEST_MUTATION, {
      input: bookingInput(start, {
        patientName: "  Marie Curie ",
        patientEmail: " Marie@Example.COM ",
        reason: "   ",
      }),
    });

    expect(result.errors).toBeUndefined();
    const stored = await prisma.appointment.findFirstOrThrow();
    expect(stored.patientName).toBe("Marie Curie");
    expect(stored.patientEmail).toBe("marie@example.com");
    expect(stored.reason).toBeNull();
  });

  it("rate-limits requests per IP", async () => {
    const starts = Array.from({ length: 6 }, (_, i) => futureDate(DAY + i * 60 * 60_000));
    for (const s of starts) await createSlot(s, "MAXILLO_FACIAL");

    const ctx: GraphQLContext = { session: null, clientIp: "203.0.113.7" };
    const results = [];
    for (const [i, s] of starts.entries()) {
      results.push(
        await exec(REQUEST_MUTATION, { input: bookingInput(s, { patientEmail: `p${i}@example.com` }) }, ctx)
      );
    }

    expect(results.slice(0, 5).every((r) => !r.errors)).toBe(true);
    expect(results[5].errors?.[0]?.extensions?.code).toBe("TOO_MANY_REQUESTS");
    expect(await prisma.appointment.count()).toBe(5);
  });

  it("rate-limits requests per email, across IPs", async () => {
    const starts = Array.from({ length: 4 }, (_, i) => futureDate(DAY + i * 60 * 60_000));
    for (const s of starts) await createSlot(s, "MAXILLO_FACIAL");

    const results = [];
    for (const [i, s] of starts.entries()) {
      results.push(
        await exec(REQUEST_MUTATION, { input: bookingInput(s) }, { session: null, clientIp: `10.1.0.${i}` })
      );
    }

    expect(results.slice(0, 3).every((r) => !r.errors)).toBe(true);
    expect(results[3].errors?.[0]?.extensions?.code).toBe("TOO_MANY_REQUESTS");
  });
});

describe("query ranges", () => {
  it("rejects an availableSlots range longer than the maximum", async () => {
    const result = await exec(
      `query($from: DateTime!, $to: DateTime!) {
        availableSlots(category: MAXILLO_FACIAL, from: $from, to: $to) { start }
      }`,
      { from: new Date().toISOString(), to: futureDate(400 * DAY).toISOString() }
    );
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
  });
});

describe("motif (donnée sensible) — purge", () => {
  it("clears the reason when the patient cancels", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      reason: "douleur ATM",
    });

    const result = await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { status } } }`,
      { token: appt.cancellationToken }
    );

    expect(result.errors).toBeUndefined();
    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } })).reason).toBeNull();
  });

  it("clears the reason when the practitioner cancels", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      reason: "douleur ATM",
    });

    await exec(
      `mutation($id: ID!) { cancelAppointmentAsAdmin(id: $id) { status } }`,
      { id: appt.id },
      authed
    );

    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } })).reason).toBeNull();
  });

  it("clears the reason when a pending appointment expires", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "PENDING",
      expiresAt: futureDate(-60_000),
      reason: "douleur ATM",
    });

    await exec(
      `query($from: DateTime!, $to: DateTime!) {
        availableSlots(category: MAXILLO_FACIAL, from: $from, to: $to) { start }
      }`,
      { from: new Date().toISOString(), to: futureDate(2 * DAY).toISOString() }
    );

    const stored = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(stored.status).toBe("EXPIRED");
    expect(stored.reason).toBeNull();
  });
});

describe("token format", () => {
  it("rejects malformed tokens without hitting the database lookup", async () => {
    const confirm = await exec(
      `mutation($token: String!) { confirmAppointment(token: $token) { appointment { id } } }`,
      { token: "x".repeat(10_000) }
    );
    expect(firstErrorMessage(confirm)).toBe("Lien de confirmation invalide.");

    const cancel = await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { id } } }`,
      { token: "' OR 1=1 --" }
    );
    expect(firstErrorMessage(cancel)).toBe("Lien d'annulation invalide.");
  });
});

describe("emails", () => {
  it("frees the slot and reports an error when the confirmation email cannot be sent", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    const spy = vi.spyOn(emailSend, "sendEmail").mockRejectedValueOnce(new Error("Brevo down"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await exec(REQUEST_MUTATION, { input: bookingInput(start) });

    spy.mockRestore();
    errorLog.mockRestore();
    expect(firstErrorMessage(result)).toMatch(/Impossible d'envoyer l'email de validation/);
    const stored = await prisma.appointment.findFirstOrThrow();
    expect(stored.status).toBe("EXPIRED");
    expect(stored.reason).toBeNull();
  });

  it("on confirmation, emails the patient (with cancel link) and the practitioner, once", async () => {
    process.env.PRACTITIONER_NOTIFICATION_EMAIL = "cabinet@example.com";
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      patientName: "Marie <b>Curie</b>",
      reason: "douleur ATM",
    });
    const confirm = () =>
      exec(
        `mutation($token: String!) { confirmAppointment(token: $token) { appointment { status } } }`,
        { token: appt.confirmationToken }
      );

    await Promise.all([confirm(), confirm()]);
    await confirm();
    delete process.env.PRACTITIONER_NOTIFICATION_EMAIL;

    expect(devOutbox.map((e) => e.to).sort()).toEqual(["cabinet@example.com", "test@example.com"]);
    const patientEmail = devOutbox.find((e) => e.to === "test@example.com")!;
    expect(patientEmail.text).toContain(`/rendez-vous/annule?token=${appt.cancellationToken}`);
    // Motif jamais envoyé par email, et contenu patient échappé dans le HTML.
    for (const e of devOutbox) {
      expect(e.text).not.toContain("douleur ATM");
      expect(e.html).not.toContain("douleur ATM");
      expect(e.html).not.toContain("<b>Curie</b>");
    }
  });

  it("skips the practitioner notification when no recipient is configured", async () => {
    const appt = await createAppointment({ slotStart: futureDate(DAY), category: "MAXILLO_FACIAL" });
    await exec(
      `mutation($token: String!) { confirmAppointment(token: $token) { appointment { status } } }`,
      { token: appt.confirmationToken }
    );
    expect(devOutbox.map((e) => e.to)).toEqual(["test@example.com"]);
  });

  it("notifies the practitioner when a patient cancels a confirmed appointment", async () => {
    process.env.PRACTITIONER_NOTIFICATION_EMAIL = "cabinet@example.com";
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
    });
    await exec(
      `mutation($token: String!) { cancelAppointment(token: $token) { appointment { status } } }`,
      { token: appt.cancellationToken }
    );
    delete process.env.PRACTITIONER_NOTIFICATION_EMAIL;
    expect(devOutbox.map((e) => e.to)).toEqual(["cabinet@example.com"]);
  });

  it("emails the patient when the practitioner cancels a confirmed appointment, not a pending one", async () => {
    const confirmed = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      patientEmail: "confirmed@example.com",
    });
    const pending = await createAppointment({
      slotStart: futureDate(2 * DAY),
      category: "MAXILLO_FACIAL",
      status: "PENDING",
      patientEmail: "pending@example.com",
    });
    for (const id of [confirmed.id, pending.id]) {
      await exec(`mutation($id: ID!) { cancelAppointmentAsAdmin(id: $id) { status } }`, { id }, authed);
    }
    expect(devOutbox.map((e) => e.to)).toEqual(["confirmed@example.com"]);
  });
});

describe("resendConfirmationEmail", () => {
  const RESEND = `mutation($id: ID!) { resendConfirmationEmail(appointmentId: $id) }`;

  it("resends the link of a pending appointment, at most twice", async () => {
    const appt = await createAppointment({ slotStart: futureDate(DAY), category: "MAXILLO_FACIAL" });

    expect((await exec(RESEND, { id: appt.id })).data?.resendConfirmationEmail).toBe(true);
    expect((await exec(RESEND, { id: appt.id })).data?.resendConfirmationEmail).toBe(true);
    const third = await exec(RESEND, { id: appt.id });

    expect(third.errors?.[0]?.extensions?.code).toBe("TOO_MANY_REQUESTS");
    expect(devOutbox).toHaveLength(2);
    expect(devOutbox[0].text).toContain(appt.confirmationToken);
  });

  it("refuses for a confirmed or unknown appointment", async () => {
    const appt = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
    });
    expect((await exec(RESEND, { id: appt.id })).errors).toBeDefined();
    expect((await exec(RESEND, { id: "inconnu" })).errors).toBeDefined();
    expect(devOutbox).toHaveLength(0);
  });
});
