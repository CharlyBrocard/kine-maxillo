import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { purgeExpiredAppointments, purgeStaleReasons } from "@/lib/retention";
import {
  APPOINTMENT_RETENTION_DAYS,
  REASON_RETENTION_DAYS,
  UNCONFIRMED_RETENTION_DAYS,
} from "@/lib/booking-constants";
import { createAppointment, futureDate } from "@/test-support/factories";

const DAY = 24 * 60 * 60_000;

describe("purgeStaleReasons", () => {
  it("clears reasons past the retention delay, and of cancelled/expired appointments", async () => {
    const old = await createAppointment({
      slotStart: futureDate(-(REASON_RETENTION_DAYS + 1) * DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      reason: "ancien motif",
    });
    const recent = await createAppointment({
      slotStart: futureDate(-(REASON_RETENTION_DAYS - 1) * DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      reason: "motif récent",
    });
    const upcoming = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      reason: "motif à venir",
    });
    const cancelled = await createAppointment({
      slotStart: futureDate(2 * DAY),
      category: "MAXILLO_FACIAL",
      status: "CANCELLED",
      reason: "motif annulé",
    });

    expect(await purgeStaleReasons()).toBe(2);

    const reasonOf = async (id: string) =>
      (await prisma.appointment.findUniqueOrThrow({ where: { id } })).reason;
    expect(await reasonOf(old.id)).toBeNull();
    expect(await reasonOf(cancelled.id)).toBeNull();
    expect(await reasonOf(recent.id)).toBe("motif récent");
    expect(await reasonOf(upcoming.id)).toBe("motif à venir");
  });
});

describe("purgeExpiredAppointments", () => {
  it("deletes never-confirmed requests after 30 days and every appointment 12 months after its date", async () => {
    const oldUnconfirmed = await createAppointment({
      slotStart: futureDate(DAY),
      category: "MAXILLO_FACIAL",
      status: "EXPIRED",
    });
    await prisma.appointment.update({
      where: { id: oldUnconfirmed.id },
      data: { createdAt: futureDate(-(UNCONFIRMED_RETENTION_DAYS + 1) * DAY) },
    });
    const recentUnconfirmed = await createAppointment({
      slotStart: futureDate(2 * DAY),
      category: "MAXILLO_FACIAL",
      status: "EXPIRED",
    });
    const veryOld = await createAppointment({
      slotStart: futureDate(-(APPOINTMENT_RETENTION_DAYS + 2) * DAY),
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
    });
    const lastMonth = await createAppointment({
      slotStart: futureDate(-30 * DAY),
      category: "PRESSOTHERAPIE",
      status: "CONFIRMED",
    });

    expect(await purgeExpiredAppointments()).toBe(2);

    const remaining = (await prisma.appointment.findMany({ select: { id: true } })).map((a) => a.id).sort();
    expect(remaining).toEqual([recentUnconfirmed.id, lastMonth.id].sort());
    expect(remaining).not.toContain(oldUnconfirmed.id);
    expect(remaining).not.toContain(veryOld.id);
  });
});
