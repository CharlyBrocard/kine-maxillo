import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import { CABINET_TIMEZONE, cabinetParts } from "@/lib/date-utils";

/**
 * Fichier d'agenda (.ics, RFC 5545) joint aux emails de RDV : un tap dans
 * l'app Mail de l'iPhone (ou Gmail, Outlook…) ajoute l'événement à
 * l'agenda. Événement simple (METHOD:PUBLISH), sans rappel — choix de la
 * praticienne. Une annulation ultérieure ne met pas l'événement à jour.
 */

const TIMEZONE = CABINET_TIMEZONE;

/**
 * Définition du fuseau Europe/Paris (heure d'été : dernier dimanche de
 * mars → dernier dimanche d'octobre). Incluse pour que DTSTART;TZID soit
 * interprété correctement par tous les agendas.
 */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIMEZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** Échappement des valeurs texte (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Découpe les lignes à 75 octets (UTF-8), suite précédée d'un espace (RFC 5545 §3.1). */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // la suite commence par un espace
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Heure locale du cabinet, déclarée avec TZID=Europe/Paris. */
function localCabinetTime(date: Date): string {
  const p = cabinetParts(date);
  return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}00`;
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type CalendarEvent = {
  /** Identifiant stable (même RDV → même UID, pas de doublon si ajouté deux fois). */
  uid: string;
  start: Date;
  summary: string;
  location: string;
  description: string;
  url?: string;
};

/**
 * Lien "Ajouter à Google Agenda" (pré-remplit l'événement, enregistrement
 * au clic) — complément du .ics pour ceux qui lisent leurs emails dans
 * Gmail sur le web, où la pièce jointe n'a pas de bouton d'ajout.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const end = new Date(event.start.getTime() + SLOT_DURATION_MINUTES * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${utcStamp(event.start)}/${utcStamp(end)}`,
    ctz: TIMEZONE,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const end = new Date(event.start.getTime() + SLOT_DURATION_MINUTES * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kine-maxillo-lyon.com//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=${TIMEZONE}:${localCabinetTime(event.start)}`,
    `DTEND;TZID=${TIMEZONE}:${localCabinetTime(end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
