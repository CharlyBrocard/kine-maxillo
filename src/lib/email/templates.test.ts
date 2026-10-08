import { describe, it, expect } from "vitest";
import { appointmentConfirmedEmail, newAppointmentNotification } from "@/lib/email/templates";

const base = {
  id: "appt123",
  slotStart: new Date("2030-01-07T09:00:00Z"),
  patientName: "Marie Curie",
  patientEmail: "marie@example.com",
  patientPhone: "0611111111",
};

describe("appointmentConfirmedEmail — accès au cabinet", () => {
  it("tells the patient the entrance is on the school side", () => {
    const email = appointmentConfirmedEmail({ ...base, category: "MAXILLO_FACIAL" }, "tok");
    expect(email.text).toContain("côté école, et non côté rue");
    expect(email.html).toContain("côté école, et non côté rue");
  });
});

describe("appointmentConfirmedEmail — documents à apporter", () => {
  it("lists Vitale card, prescription, mutual insurance card and payment for maxillo-facial", () => {
    const email = appointmentConfirmedEmail({ ...base, category: "MAXILLO_FACIAL" }, "tok");
    for (const item of ["carte Vitale", "ordonnance", "carte de mutuelle", "carte bancaire, espèces ou virement"]) {
      expect(email.text).toContain(item);
      expect(email.html).toContain(item);
    }
    expect(email.html).toContain("<li>");
  });

  it("only asks for a payment method for pressotherapy (not reimbursed)", () => {
    const email = appointmentConfirmedEmail({ ...base, category: "PRESSOTHERAPIE" }, "tok");
    expect(email.text).toContain("carte bancaire, espèces ou virement");
    for (const item of ["carte Vitale", "ordonnance", "mutuelle"]) {
      expect(email.text).not.toContain(item);
      expect(email.html).not.toContain(item);
    }
  });
});

describe("calendar attachment (.ics)", () => {
  const icsOf = (email: { attachments?: Array<{ name: string; content: string }> } | null) =>
    email?.attachments?.find((a) => a.name === "rendez-vous.ics")?.content ?? "";

  it("is attached to the patient's confirmation, in Paris time, without a reminder", () => {
    const ics = icsOf(appointmentConfirmedEmail({ ...base, category: "MAXILLO_FACIAL" }, "tok"));
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20300107T090000");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20300107T093000");
    expect(ics).toContain("UID:appt123@kine-maxillo-lyon.com");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).not.toContain("VALARM");
    expect(ics.replace(/\r\n /g, "")).toContain("/rendez-vous/annule?token=tok");
  });

  it("is attached to the practitioner's notification, with patient contact but never the reason", () => {
    process.env.PRACTITIONER_NOTIFICATION_EMAIL = "cabinet@example.com";
    const ics = icsOf(
      newAppointmentNotification({ ...base, category: "MAXILLO_FACIAL" })
    );
    delete process.env.PRACTITIONER_NOTIFICATION_EMAIL;
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("SUMMARY:Marie Curie — Rééducation maxillo-faciale");
    expect(unfolded).toContain("0611111111");
    expect(unfolded).not.toMatch(/motif|reason/i);
  });

  it("uses CRLF line endings, folds long lines at 75 bytes and escapes commas", () => {
    const ics = icsOf(appointmentConfirmedEmail({ ...base, category: "MAXILLO_FACIAL" }, "tok"));
    const lines = ics.split("\r\n");
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain("LOCATION:6 Av. Jacques Nemos\\, 69390 Millery");
  });
});
