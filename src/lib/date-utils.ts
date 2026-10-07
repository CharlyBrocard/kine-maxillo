/**
 * Toutes les fonctions ci-dessous raisonnent en UTC, indépendamment du
 * fuseau horaire de la machine qui exécute le code (dev, CI, VPS) — pour
 * que le calcul des créneaux soit déterministe partout. Ça revient à
 * traiter "UTC" comme l'heure du cabinet ; à revoir avant prod si le
 * serveur ne tourne pas en Europe/Paris (décalage horaire, heure d'été).
 */
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

/** "YYYY-MM-DD" + "HH:mm" -> Date UTC (ex. "2026-09-01" + "09:30"). */
export function dateFromInputs(dateValue: string, timeValue: string): Date {
  return new Date(`${dateValue}T${timeValue}:00.000Z`);
}
