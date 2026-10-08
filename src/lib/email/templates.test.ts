import { describe, it, expect } from "vitest";
import { appointmentConfirmedEmail } from "@/lib/email/templates";

const base = {
  slotStart: new Date("2030-01-07T09:00:00Z"),
  patientName: "Marie Curie",
  patientEmail: "marie@example.com",
  patientPhone: "0611111111",
};

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
