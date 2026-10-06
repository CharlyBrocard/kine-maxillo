import { prisma } from "@/lib/prisma";
import { REASON_RETENTION_DAYS } from "@/lib/booking-constants";

/**
 * Efface le motif (donnée de santé potentielle — voir "Décisions
 * produit" dans PROJECT.md) : immédiatement pour les RDV annulés ou
 * expirés, REASON_RETENTION_DAYS jours après la fin pour les autres.
 * Effacement réel de la colonne (NULL), pas un masquage.
 */
export async function purgeStaleReasons(): Promise<number> {
  const cutoff = new Date(Date.now() - REASON_RETENTION_DAYS * 24 * 60 * 60_000);
  const { count } = await prisma.appointment.updateMany({
    where: {
      reason: { not: null },
      OR: [{ status: { in: ["CANCELLED", "EXPIRED"] } }, { slotEnd: { lt: cutoff } }],
    },
    data: { reason: null },
  });
  return count;
}
