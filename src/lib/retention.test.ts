import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { purgeStaleReasons } from "@/lib/retention";
import { REASON_RETENTION_DAYS } from "@/lib/booking-constants";
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
