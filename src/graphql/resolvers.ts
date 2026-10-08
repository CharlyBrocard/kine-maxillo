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
import { assertQueryRange, isWellFormedToken, validatePatientInput } from "@/lib/validation";
import { hit } from "@/lib/rate-limit";
import { purgeStaleReasons } from "@/lib/retention";
import { sendEmail, sendEmailSafely } from "@/lib/email/send";
import {
  appointmentConfirmedEmail,
  cancelledByPractitionerEmail,
  confirmationRequestEmail,
  newAppointmentNotification,
  patientCancellationNotification,
} from "@/lib/email/templates";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import type { GraphQLContext } from "@/graphql/context";

/**
 * Limites de demandes de RDV : chaque demande bloque un créneau 20 min,
 * un bot pourrait sinon vider l'agenda en continu (et, une fois Brevo
 * branché, envoyer des emails à des tiers).
 */
const BOOKING_LIMIT_WINDOW_MS = 60 * 60_000;
const BOOKING_LIMIT_PER_IP = 5;
const BOOKING_LIMIT_PER_EMAIL = 3;

/** Renvois de l'email de validation, par RDV (en plus de la limite par IP). */
const RESEND_LIMIT_PER_APPOINTMENT = 2;

async function notify(email: Parameters<typeof sendEmailSafely>[0] | null): Promise<void> {
  if (email) await sendEmailSafely(email);
}

function tooManyRequests(): GraphQLError {
  return new GraphQLError(
    "Trop de demandes de rendez-vous. Réessayez plus tard ou appelez le cabinet.",
    { extensions: { code: "TOO_MANY_REQUESTS" } }
  );
}

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
      assertQueryRange(from, to);
      await expireStalePendingAppointments();
      return computeAvailableSlots(category, from, to);
    },

    appointments: async (
      _: unknown,
      { from, to }: { from: Date; to: Date },
      context: GraphQLContext
    ) => {
      requireSession(context);
      assertQueryRange(from, to);
      await expireStalePendingAppointments();
      await purgeStaleReasons();
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
      assertQueryRange(from, to);
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
          motif?: string | null;
          reason?: string | null;
        };
      },
      context: GraphQLContext
    ) => {
      const patient = validatePatientInput(input);
      if (!hit(`booking:ip:${context.clientIp ?? "unknown"}`, BOOKING_LIMIT_PER_IP, BOOKING_LIMIT_WINDOW_MS)) {
        throw tooManyRequests();
      }
      if (!hit(`booking:email:${patient.patientEmail}`, BOOKING_LIMIT_PER_EMAIL, BOOKING_LIMIT_WINDOW_MS)) {
        throw tooManyRequests();
      }

      await expireStalePendingAppointments();
      await purgeStaleReasons();

      const slotStart = input.slotStart;
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);

      if (!(await isSlotAvailable(input.category, slotStart))) {
        throw new GraphQLError("Ce créneau n'est plus disponible.");
      }

      const confirmationToken = generateToken();
      const cancellationToken = generateToken();
      const expiresAt = new Date(Date.now() + PENDING_HOLD_MINUTES * 60_000);

      let appointment;
      try {
        appointment = await prisma.appointment.create({
          data: {
            slotStart,
            slotEnd,
            category: input.category,
            ...patient,
            status: "PENDING",
            confirmationToken,
            cancellationToken,
            expiresAt,
          },
        });
      } catch (e) {
        // Index unique partiel "Appointment_active_slot_key" : une requête
        // concurrente a pris le créneau entre isSlotAvailable et l'insertion.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new GraphQLError("Ce créneau n'est plus disponible.");
        }
        throw e;
      }

      // Email de validation critique : sans lui le patient ne peut pas
      // confirmer, donc on libère le créneau tout de suite plutôt que de le
      // bloquer PENDING_HOLD_MINUTES pour rien.
      try {
        await sendEmail(confirmationRequestEmail(appointment, confirmationToken));
      } catch (e) {
        console.error("Échec d'envoi de l'email de validation :", e);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "EXPIRED", reason: null },
        });
        throw new GraphQLError(
          "Impossible d'envoyer l'email de validation. Réessayez ou appelez le cabinet."
        );
      }

      return { appointment };
    },

    confirmAppointment: async (_: unknown, { token }: { token: string }) => {
      if (!isWellFormedToken(token)) {
        throw new GraphQLError("Lien de confirmation invalide.");
      }
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

      // updateMany conditionné sur PENDING : si deux clics simultanés
      // confirment, un seul fait la transition (et envoie les emails).
      const { count } = await prisma.appointment.updateMany({
        where: { id: appointment.id, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      const updated = await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } });
      if (count === 1) {
        await sendEmailSafely(appointmentConfirmedEmail(updated, updated.cancellationToken));
        await notify(newAppointmentNotification(updated));
      }
      return { appointment: updated, cancellationToken: updated.cancellationToken };
    },

    cancelAppointment: async (_: unknown, { token }: { token: string }) => {
      if (!isWellFormedToken(token)) {
        throw new GraphQLError("Lien d'annulation invalide.");
      }
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
        data: { status: "CANCELLED", reason: null },
      });
      if (appointment.status === "CONFIRMED") {
        await notify(patientCancellationNotification(updated));
      }
      return { appointment: updated, cancellationToken: updated.cancellationToken };
    },

    resendConfirmationEmail: async (
      _: unknown,
      { appointmentId }: { appointmentId: string },
      context: GraphQLContext
    ) => {
      if (!hit(`booking:ip:${context.clientIp ?? "unknown"}`, BOOKING_LIMIT_PER_IP, BOOKING_LIMIT_WINDOW_MS)) {
        throw tooManyRequests();
      }
      if (!hit(`resend:${appointmentId}`, RESEND_LIMIT_PER_APPOINTMENT, BOOKING_LIMIT_WINDOW_MS)) {
        throw tooManyRequests();
      }
      await expireStalePendingAppointments();

      const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment || appointment.status !== "PENDING") {
        throw new GraphQLError(
          "Cette demande a expiré ou est déjà traitée. Reprenez rendez-vous ou appelez le cabinet."
        );
      }
      try {
        await sendEmail(confirmationRequestEmail(appointment, appointment.confirmationToken));
      } catch (e) {
        console.error("Échec du renvoi de l'email de validation :", e);
        throw new GraphQLError("Impossible d'envoyer l'email. Réessayez ou appelez le cabinet.");
      }
      return true;
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
      const appointment = await prisma.appointment.findUnique({ where: { id } });
      if (!appointment) throw new GraphQLError("Rendez-vous introuvable.");
      if (appointment.status === "CANCELLED") return appointment;

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED", reason: null },
      });
      // Un RDV PENDING n'a pas encore été validé par le patient : rien à prévenir.
      if (appointment.status === "CONFIRMED") {
        await sendEmailSafely(cancelledByPractitionerEmail(updated));
      }
      return updated;
    },
  },
};
