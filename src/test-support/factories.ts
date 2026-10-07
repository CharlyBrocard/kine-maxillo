import type { AppointmentStatus, Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

export function futureDate(msFromNow: number): Date {
  return new Date(Date.now() + msFromNow);
}

export function createSlot(start: Date, category: Category) {
  return prisma.availableSlot.create({ data: { start, category } });
}

export function createAppointment(opts: {
  slotStart: Date;
  category: Category;
  status?: AppointmentStatus;
  expiresAt?: Date;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  reason?: string;
}) {
  const slotEnd = new Date(opts.slotStart.getTime() + 30 * 60_000);
  return prisma.appointment.create({
    data: {
      slotStart: opts.slotStart,
      slotEnd,
      category: opts.category,
      patientName: opts.patientName ?? "Test Patient",
      patientPhone: opts.patientPhone ?? "0600000000",
      patientEmail: opts.patientEmail ?? "test@example.com",
      reason: opts.reason,
      status: opts.status ?? "PENDING",
      confirmationToken: generateToken(),
      cancellationToken: generateToken(),
      expiresAt: opts.expiresAt ?? futureDate(20 * 60_000),
    },
  });
}
