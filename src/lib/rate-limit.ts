/**
 * Limiteur de débit en mémoire, à fenêtre fixe. Suffisant pour le
 * déploiement prévu (un seul conteneur Next.js sur le VPS) : les
 * compteurs sont perdus au redémarrage et ne sont pas partagés entre
 * plusieurs instances — à remplacer (Postgres/Redis) si l'app passe un
 * jour à plusieurs instances.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Comptabilise un hit pour `key` et indique s'il reste sous `limit` sur
 * la fenêtre `windowMs`.
 */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Indique si `key` a déjà atteint `limit`, sans comptabiliser de hit. */
export function isLimited(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}

export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * IP du client derrière le reverse proxy (Nginx sur le VPS). La config
 * Nginx (deploy/nginx/) remplace X-Forwarded-For par $remote_addr ; on
 * lit quand même la dernière entrée, qui reste l'IP vue par le proxy si
 * celui-ci ajoute au lieu de remplacer — jamais une valeur du client.
 * Sans proxy (dev), pas d'en-tête : tout le monde partage la clé "unknown".
 */
export function clientIpFromHeaders(get: (name: string) => string | null | undefined): string {
  const forwarded = get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || get("x-real-ip")?.trim() || "unknown";
}
