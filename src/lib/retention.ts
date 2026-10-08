import { prisma } from "@/lib/prisma";
import {
  APPOINTMENT_RETENTION_DAYS,
  REASON_RETENTION_DAYS,
  UNCONFIRMED_RETENTION_DAYS,
} from "@/lib/booking-constants";

const DAY_MS = 24 * 60 * 60_000;

/**
 * Efface le motif (donnée de santé potentielle — voir "Décisions
 * produit" dans PROJECT.md) : immédiatement pour les RDV annulés ou
 * expirés, REASON_RETENTION_DAYS jours après la fin pour les autres.
 * Effacement réel de la colonne (NULL), pas un masquage.
 */
export async function purgeStaleReasons(): Promise<number> {
  const cutoff = new Date(Date.now() - REASON_RETENTION_DAYS * DAY_MS);
  const { count } = await prisma.appointment.updateMany({
    where: {
      reason: { not: null },
      OR: [{ status: { in: ["CANCELLED", "EXPIRED"] } }, { slotEnd: { lt: cutoff } }],
    },
    data: { reason: null },
  });
  return count;
}

/**
 * Supprime les RDV (et donc les coordonnées des patients) arrivés au bout
 * de leur durée de conservation — voir UNCONFIRMED_RETENTION_DAYS et
 * APPOINTMENT_RETENTION_DAYS. Suppression réelle des lignes.
 */
export async function purgeExpiredAppointments(): Promise<number> {
  const now = Date.now();
  const { count } = await prisma.appointment.deleteMany({
    where: {
      OR: [
        {
          status: { in: ["PENDING", "EXPIRED"] },
          createdAt: { lt: new Date(now - UNCONFIRMED_RETENTION_DAYS * DAY_MS) },
        },
        { slotEnd: { lt: new Date(now - APPOINTMENT_RETENTION_DAYS * DAY_MS) } },
      ],
    },
  });
  return count;
}
