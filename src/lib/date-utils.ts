/**
 * Dates et heure du cabinet. Les dates sont stockées et échangées comme de
 * vrais instants (UTC) ; tout ce qui dépend du calendrier — jour, semaine,
 * heure affichée, heure saisie par la praticienne — est calculé dans le
 * fuseau du cabinet (Europe/Paris, heure d'été comprise), quel que soit le
 * fuseau de la machine qui exécute le code (navigateur du patient, VPS,
 * CI).
 */
export const CABINET_TIMEZONE = "Europe/Paris";

type CabinetParts = {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = dimanche … 6 = samedi */
  weekday: number;
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CABINET_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Composantes de calendrier d'un instant, à l'heure du cabinet. */
export function cabinetParts(date: Date): CabinetParts {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Décalage (ms) de l'heure du cabinet par rapport à UTC à cet instant (+1 h ou +2 h). */
function cabinetOffsetMs(date: Date): number {
  const p = cabinetParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

/**
 * Instant correspondant à une date et une heure "murales" du cabinet.
 * Les débordements sont normalisés (jour 32 → mois suivant), comme Date.UTC.
 */
export function cabinetTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // Deux passes : le décalage dépend de l'instant cherché (changement d'heure).
  let instant = wall - cabinetOffsetMs(new Date(wall));
  instant = wall - cabinetOffsetMs(new Date(instant));
  return new Date(instant);
}

/** Minuit (heure du cabinet) du jour contenant `date`. */
export function startOfCabinetDay(date: Date): Date {
  const p = cabinetParts(date);
  return cabinetTime(p.year, p.month, p.day);
}

/** Minuit (heure du cabinet) du jour situé `days` jours après celui de `date`. */
export function addCabinetDays(date: Date, days: number): Date {
  const p = cabinetParts(date);
  return cabinetTime(p.year, p.month, p.day + days);
}

export function isSameCabinetDay(a: Date, b: Date): boolean {
  const pa = cabinetParts(a);
  const pb = cabinetParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** Lundi minuit (heure du cabinet) de la semaine calendaire contenant `date`. */
export function mondayOfCabinetWeek(date: Date): Date {
  const { weekday } = cabinetParts(date);
  return addCabinetDays(date, weekday === 0 ? -6 : 1 - weekday);
}

/** Numéro du jour dans le mois, à l'heure du cabinet. */
export function cabinetDayOfMonth(date: Date): number {
  return cabinetParts(date).day;
}

/** Affichage HH:mm à l'heure du cabinet. */
export function formatCabinetTime(date: Date): string {
  const p = cabinetParts(date);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Affichage d'une date en français, à l'heure du cabinet. */
export function formatCabinetDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("fr-FR", { ...options, timeZone: CABINET_TIMEZONE });
}

/** "YYYY-MM-DD" + "HH:mm" saisis par la praticienne (heure du cabinet) -> instant. */
export function dateFromInputs(dateValue: string, timeValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return cabinetTime(year, month, day, hour, minute);
}
