import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  computeAvailableSlots,
  isSlotAvailable,
  expireStalePendingAppointments,
} from "@/lib/slots";
import { createAppointment, createSlot, futureDate } from "@/test-support/factories";

const DAY = 24 * 60 * 60_000;

describe("computeAvailableSlots", () => {
  it("returns an open slot for its category within range", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));

    expect(slots).toHaveLength(1);
    expect(slots[0].start.getTime()).toBe(start.getTime());
    expect(slots[0].end.getTime()).toBe(start.getTime() + 30 * 60_000);
  });

  it("does not leak a slot into another category's results", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));

    expect(slots).toHaveLength(0);
  });

  it("excludes a slot covered by a CONFIRMED appointment", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    await createAppointment({ slotStart: start, category: "MAXILLO_FACIAL", status: "CONFIRMED" });

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));

    expect(slots).toHaveLength(0);
  });

  it("excludes a slot covered by a non-expired PENDING appointment", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    await createAppointment({
      slotStart: start,
      category: "MAXILLO_FACIAL",
      status: "PENDING",
      expiresAt: futureDate(10 * 60_000),
    });

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));

    expect(slots).toHaveLength(0);
  });

  it("does NOT exclude a slot whose PENDING hold has expired", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    await createAppointment({
      slotStart: start,
      category: "MAXILLO_FACIAL",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
    });

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));

    expect(slots).toHaveLength(1);
  });

  it("excludes slots in the past even if within the query range", async () => {
    const past = new Date(Date.now() - 60 * 60_000);
    await prisma.availableSlot.create({ data: { start: past, category: "MAXILLO_FACIAL" } });

    const slots = await computeAvailableSlots(
      "MAXILLO_FACIAL",
      new Date(Date.now() - 2 * 60 * 60_000),
      futureDate(60 * 60_000)
    );

    expect(slots).toHaveLength(0);
  });
});

describe("isSlotAvailable", () => {
  it("is true for an open, unbooked slot", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");

    expect(await isSlotAvailable("PRESSOTHERAPIE", start)).toBe(true);
  });

  it("is false when no such slot was opened", async () => {
    expect(await isSlotAvailable("PRESSOTHERAPIE", futureDate(DAY))).toBe(false);
  });

  it("is false once the slot is booked (CONFIRMED)", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "PRESSOTHERAPIE");
    await createAppointment({ slotStart: start, category: "PRESSOTHERAPIE", status: "CONFIRMED" });

    expect(await isSlotAvailable("PRESSOTHERAPIE", start)).toBe(false);
  });
});

describe("expireStalePendingAppointments", () => {
  it("flips an overdue PENDING appointment to EXPIRED and frees its slot", async () => {
    const start = futureDate(DAY);
    await createSlot(start, "MAXILLO_FACIAL");
    const appt = await createAppointment({
      slotStart: start,
      category: "MAXILLO_FACIAL",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expireStalePendingAppointments();

    const updated = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(updated.status).toBe("EXPIRED");

    const slots = await computeAvailableSlots("MAXILLO_FACIAL", new Date(), futureDate(2 * DAY));
    expect(slots).toHaveLength(1);
  });

  it("leaves CONFIRMED appointments untouched even past their old expiresAt", async () => {
    const start = futureDate(DAY);
    const appt = await createAppointment({
      slotStart: start,
      category: "MAXILLO_FACIAL",
      status: "CONFIRMED",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expireStalePendingAppointments();

    const updated = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(updated.status).toBe("CONFIRMED");
  });
});
