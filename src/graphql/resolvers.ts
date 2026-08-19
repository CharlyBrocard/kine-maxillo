import { DateTimeResolver } from "graphql-scalars";
import { GraphQLError } from "graphql";
import type { DayOfWeek, ExceptionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeAvailableSlots,
  expireStalePendingAppointments,
  isSlotAvailable,
} from "@/lib/slots";
import { generateToken } from "@/lib/tokens";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    availableSlots: async (_: unknown, { from, to }: { from: Date; to: Date }) => {
      await expireStalePendingAppointments();
      return computeAvailableSlots(from, to);
    },

    appointments: async (_: unknown, { from, to }: { from: Date; to: Date }) => {
      await expireStalePendingAppointments();
      return prisma.appointment.findMany({
        where: { slotStart: { lt: to }, slotEnd: { gt: from } },
        orderBy: { slotStart: "asc" },
      });
    },
  },

  Mutation: {
    requestAppointment: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          slotStart: Date;
          patientName: string;
          patientPhone: string;
          patientEmail: string;
          reason?: string;
        };
      }
    ) => {
      await expireStalePendingAppointments();

      const slotStart = input.slotStart;
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);

      if (!(await isSlotAvailable(slotStart))) {
        throw new GraphQLError("Ce créneau n'est plus disponible.");
      }

      const confirmationToken = generateToken();
      const cancellationToken = generateToken();
      const expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60_000);

      const appointment = await prisma.appointment.create({
        data: {
          slotStart,
          slotEnd,
          patientName: input.patientName,
          patientPhone: input.patientPhone,
          patientEmail: input.patientEmail,
          reason: input.reason,
          status: "PENDING",
          confirmationToken,
          cancellationToken,
          expiresAt,
        },
      });

      return { appointment, confirmationToken, cancellationToken };
    },

    confirmAppointment: async (_: unknown, { token }: { token: string }) => {
      await expireStalePendingAppointments();

      const appointment = await prisma.appointment.findUnique({
        where: { confirmationToken: token },
      });
      if (!appointment) {
        throw new GraphQLError("Lien de confirmation invalide.");
      }
      // Idempotent : recharger le lien après confirmation ne doit pas
      // faire échouer l'écran (rechargement de page, double-clic).
      if (appointment.status === "CONFIRMED") {
        return { appointment, cancellationToken: appointment.cancellationToken };
      }
      if (appointment.status !== "PENDING") {
        throw new GraphQLError(
          "Ce rendez-vous ne peut plus être confirmé (annulé ou expiré)."
        );
      }

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CONFIRMED" },
      });
      return { appointment: updated, cancellationToken: updated.cancellationToken };
    },

    cancelAppointment: async (_: unknown, { token }: { token: string }) => {
      const appointment = await prisma.appointment.findUnique({
        where: { cancellationToken: token },
      });
      if (!appointment) {
        throw new GraphQLError("Lien d'annulation invalide.");
      }
      if (appointment.status === "CANCELLED") {
        return { appointment, cancellationToken: appointment.cancellationToken };
      }

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED" },
      });
      return { appointment: updated, cancellationToken: updated.cancellationToken };
    },

    setAvailabilityRule: async (
      _: unknown,
      {
        input,
      }: { input: { dayOfWeek: DayOfWeek; startTime: number; endTime: number } }
    ) => {
      // TODO(étape suivante) : protéger par NextAuth (mono-compte praticienne).
      return prisma.availabilityRule.create({ data: input });
    },

    addAvailabilityException: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          date: Date;
          type: ExceptionType;
          reason?: string;
          startTime?: number;
          endTime?: number;
        };
      }
    ) => {
      // TODO(étape suivante) : protéger par NextAuth (mono-compte praticienne).
      return prisma.availabilityException.create({ data: input });
    },

    cancelAppointmentAsAdmin: async (_: unknown, { id }: { id: string }) => {
      // TODO(étape suivante) : protéger par NextAuth (mono-compte praticienne).
      return prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    },
  },
};
