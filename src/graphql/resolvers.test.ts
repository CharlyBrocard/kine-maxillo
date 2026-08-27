import { describe, it, expect } from "vitest";
import { graphql, type GraphQLError } from "graphql";
import { schema } from "@/graphql/schema";
import { prisma } from "@/lib/prisma";
import { createAppointment, createSlot, futureDate } from "@/test-support/factories";
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
  it("books an open slot and returns tokens", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");

    const result = await exec(
      `mutation($input: RequestAppointmentInput!) {
        requestAppointment(input: $input) {
          appointment { status category }
          confirmationToken
          cancellationToken
        }
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
      appointment: { status: string; category: string };
      confirmationToken: string;
      cancellationToken: string;
    };
    expect(payload.appointment.status).toBe("PENDING");
    expect(payload.appointment.category).toBe("PRESSOTHERAPIE");
    expect(payload.confirmationToken).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.cancellationToken).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.confirmationToken).not.toBe(payload.cancellationToken);
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
