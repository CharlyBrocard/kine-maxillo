import { prisma } from "@/lib/prisma";
import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import {
  addUTCDays,
  dateAtUTCMinutes,
  dayOfWeekOf,
  isSameUTCDay,
  startOfUTCDay,
} from "@/lib/date-utils";

export type Slot = { start: Date; end: Date };

type MinuteRange = [number, number];

/** Retire `cut` de chaque intervalle de `ranges`, en les découpant si besoin. */
function subtractRange(ranges: MinuteRange[], cut: MinuteRange): MinuteRange[] {
  const [cutStart, cutEnd] = cut;
  const result: MinuteRange[] = [];
  for (const [start, end] of ranges) {
    if (cutEnd <= start || cutStart >= end) {
      result.push([start, end]);
      continue;
    }
    if (cutStart > start) result.push([start, cutStart]);
    if (cutEnd < end) result.push([cutEnd, end]);
  }
  return result;
}

/**
 * Calcule les créneaux disponibles sur [from, to) à la volée, comme décrit
 * dans PROJECT.md : AvailabilityRule + AvailabilityException, moins les
 * Appointment en pending (non expirés) ou confirmed sur la période.
 */
export async function computeAvailableSlots(
  from: Date,
  to: Date
): Promise<Slot[]> {
  const [rules, exceptions, appointments] = await Promise.all([
    prisma.availabilityRule.findMany(),
    prisma.availabilityException.findMany({
      where: { date: { gte: startOfUTCDay(from), lte: startOfUTCDay(to) } },
    }),
    prisma.appointment.findMany({
      where: {
        slotStart: { lt: to },
        slotEnd: { gt: from },
        OR: [
          { status: "CONFIRMED" },
          { status: "PENDING", expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ]);

  const now = new Date();
  const slots: Slot[] = [];

  for (
    let day = startOfUTCDay(from);
    day < to;
    day = addUTCDays(day, 1)
  ) {
    const dow = dayOfWeekOf(day);
    let ranges: MinuteRange[] = rules
      .filter((r) => r.dayOfWeek === dow)
      .map((r) => [r.startTime, r.endTime] as MinuteRange);

    for (const exc of exceptions) {
      if (!isSameUTCDay(exc.date, day)) continue;
      if (exc.type === "CLOSED") {
        ranges =
          exc.startTime == null || exc.endTime == null
            ? []
            : subtractRange(ranges, [exc.startTime, exc.endTime]);
      } else if (exc.startTime != null && exc.endTime != null) {
        ranges = [...ranges, [exc.startTime, exc.endTime]];
      }
    }

    for (const [rangeStart, rangeEnd] of ranges) {
      for (
        let t = rangeStart;
        t + SLOT_DURATION_MINUTES <= rangeEnd;
        t += SLOT_DURATION_MINUTES
      ) {
        const slotStart = dateAtUTCMinutes(day, t);
        const slotEnd = dateAtUTCMinutes(day, t + SLOT_DURATION_MINUTES);

        if (slotStart < from || slotStart >= to) continue;
        if (slotStart < now) continue;

        const overlaps = appointments.some(
          (a) => a.slotStart < slotEnd && a.slotEnd > slotStart
        );
        if (!overlaps) slots.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}

export async function isSlotAvailable(slotStart: Date): Promise<boolean> {
  const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);
  const slots = await computeAvailableSlots(slotStart, slotEnd);
  return slots.some((s) => s.start.getTime() === slotStart.getTime());
}

/** Bascule en EXPIRED les RDV pending dont le délai de confirmation est dépassé. */
export async function expireStalePendingAppointments(): Promise<void> {
  await prisma.appointment.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}
