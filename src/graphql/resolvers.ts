import { DateTimeResolver } from "graphql-scalars";
import { GraphQLError } from "graphql";
import { Prisma, type Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeAvailableSlots,
  expireStalePendingAppointments,
  isSlotAvailable,
} from "@/lib/slots";
import { generateToken } from "@/lib/tokens";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import type { GraphQLContext } from "@/graphql/context";

/** Mono-compte praticienne (voir PROJECT.md) — utilisé par les opérations admin. */
function requireSession(context: GraphQLContext): void {
  if (!context.session) {
    throw new GraphQLError("Authentification requise.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

async function isCoveredByActiveAppointment(
  category: Category,
  start: Date
): Promise<boolean> {
  const appointment = await prisma.appointment.findFirst({
    where: {
      category,
      slotStart: start,
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });
  return !!appointment;
}

export const resolvers = {
  DateTime: DateTimeResolver,

  AvailableSlot: {
    booked: (parent: { category: Category; start: Date }) =>
      isCoveredByActiveAppointment(parent.category, parent.start),
  },

  Query: {
    availableSlots: async (
      _: unknown,
      { category, from, to }: { category: Category; from: Date; to: Date }
    ) => {
      await expireStalePendingAppointments();
      return computeAvailableSlots(category, from, to);
    },

    appointments: async (
      _: unknown,
      { from, to }: { from: Date; to: Date },
      context: GraphQLContext
    ) => {
      requireSession(context);
      await expireStalePendingAppointments();
      return prisma.appointment.findMany({
        where: { slotStart: { lt: to }, slotEnd: { gt: from } },
        orderBy: { slotStart: "asc" },
      });
    },

    availableSlotEntries: async (
      _: unknown,
      { from, to }: { from: Date; to: Date },
      context: GraphQLContext
    ) => {
      requireSession(context);
      return prisma.availableSlot.findMany({
        where: { start: { gte: from, lt: to } },
        orderBy: { start: "asc" },
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
          category: Category;
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

      if (!(await isSlotAvailable(input.category, slotStart))) {
        throw new GraphQLError("Ce créneau n'est plus disponible.");
      }

      const confirmationToken = generateToken();
      const cancellationToken = generateToken();
      const expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60_000);

      const appointment = await prisma.appointment.create({
        data: {
          slotStart,
          slotEnd,
          category: input.category,
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

    addAvailableSlot: async (
      _: unknown,
      { input }: { input: { start: Date; category: Category } },
      context: GraphQLContext
    ) => {
      requireSession(context);
      try {
        return await prisma.availableSlot.create({ data: input });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new GraphQLError("Ce créneau est déjà ouvert pour cette catégorie.");
        }
        throw e;
      }
    },

    deleteAvailableSlot: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      requireSession(context);
      const slot = await prisma.availableSlot.findUnique({ where: { id } });
      if (!slot) return true;
      if (await isCoveredByActiveAppointment(slot.category, slot.start)) {
        throw new GraphQLError(
          "Ce créneau est réservé — annulez le rendez-vous depuis l'agenda avant de le supprimer."
        );
      }
      await prisma.availableSlot.delete({ where: { id } });
      return true;
    },

    cancelAppointmentAsAdmin: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      requireSession(context);
      return prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    },
  },
};
