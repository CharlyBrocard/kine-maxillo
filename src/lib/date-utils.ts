/**
 * Toutes les fonctions ci-dessous raisonnent en UTC, indépendamment du
 * fuseau horaire de la machine qui exécute le code (dev, CI, VPS) — pour
 * que le calcul des créneaux soit déterministe partout. Ça revient à
 * traiter "UTC" comme l'heure du cabinet ; à revoir avant prod si le
 * serveur ne tourne pas en Europe/Paris (décalage horaire, heure d'été).
 */
export const DAY_OF_WEEK_BY_INDEX = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export function startOfUTCDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function addUTCDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days
    )
  );
}

export function isSameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Construit la Date du jour donné à `minutes` minutes depuis minuit UTC. */
export function dateAtUTCMinutes(day: Date, minutes: number): Date {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, minutes)
  );
}

export function dayOfWeekOf(date: Date): (typeof DAY_OF_WEEK_BY_INDEX)[number] {
  return DAY_OF_WEEK_BY_INDEX[date.getUTCDay()];
}

/** Lundi (00:00 UTC) de la semaine calendaire contenant `date`. */
export function mondayOfUTCWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0 = dimanche .. 6 = samedi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addUTCDays(startOfUTCDay(date), diffToMonday);
}

/** Affichage HH:mm en UTC (cohérent avec le reste : UTC = heure du cabinet). */
export function formatUTCTime(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/** Affichage d'une date en français, en forçant le fuseau UTC pour cohérence. */
export function formatUTCDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleDateString("fr-FR", { ...options, timeZone: "UTC" });
}

/** "HH:mm" -> minutes depuis minuit (ex. "09:30" -> 570). */
export function minutesFromTimeInput(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** minutes depuis minuit -> "HH:mm" (ex. 570 -> "09:30"). */
export function timeInputFromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
