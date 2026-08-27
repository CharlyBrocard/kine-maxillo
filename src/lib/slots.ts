import type { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";

export type Slot = { start: Date; end: Date };

/**
 * Créneaux disponibles pour une catégorie sur [from, to) : les
 * AvailableSlot ouverts par la praticienne pour cette catégorie, moins
 * ceux déjà couverts par un RDV pending (non expiré) ou confirmed.
 */
export async function computeAvailableSlots(
  category: Category,
  from: Date,
  to: Date
): Promise<Slot[]> {
  const [openSlots, appointments] = await Promise.all([
    prisma.availableSlot.findMany({
      where: { category, start: { gte: from, lt: to } },
    }),
    prisma.appointment.findMany({
      where: {
        category,
        slotStart: { gte: from, lt: to },
        OR: [
          { status: "CONFIRMED" },
          { status: "PENDING", expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ]);

  const bookedStarts = new Set(appointments.map((a) => a.slotStart.getTime()));
  const now = new Date();

  return openSlots
    .filter((s) => s.start >= now && !bookedStarts.has(s.start.getTime()))
    .map((s) => ({
      start: s.start,
      end: new Date(s.start.getTime() + SLOT_DURATION_MINUTES * 60_000),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function isSlotAvailable(
  category: Category,
  slotStart: Date
): Promise<boolean> {
  const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);
  const slots = await computeAvailableSlots(category, slotStart, slotEnd);
  return slots.some((s) => s.start.getTime() === slotStart.getTime());
}

/** Bascule en EXPIRED les RDV pending dont le délai de confirmation est dépassé. */
export async function expireStalePendingAppointments(): Promise<void> {
  await prisma.appointment.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}
