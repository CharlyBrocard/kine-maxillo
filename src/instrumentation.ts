/**
 * Tâches de fond du serveur de production : expiration des RDV non
 * confirmés et purge du motif (voir src/lib/retention.ts), toutes les
 * heures, en plus des déclenchements opportunistes dans l'API — pour que
 * la purge ait lieu même sans trafic. Pas en dev (rechargements à chaud).
 */
const HOUSEKEEPING_INTERVAL_MS = 60 * 60_000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  const { runHousekeeping } = await import("@/lib/housekeeping");
  const run = () =>
    runHousekeeping().catch((e) => console.error("Échec des tâches de fond :", e));
  void run();
  setInterval(run, HOUSEKEEPING_INTERVAL_MS).unref();
}
