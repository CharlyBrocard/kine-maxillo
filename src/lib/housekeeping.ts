import { expireStalePendingAppointments } from "@/lib/slots";
import { purgeStaleReasons } from "@/lib/retention";

/** Voir src/instrumentation.ts. */
export async function runHousekeeping(): Promise<void> {
  await expireStalePendingAppointments();
  const purged = await purgeStaleReasons();
  if (purged > 0) console.info(`Purge du motif : ${purged} rendez-vous.`);
}
