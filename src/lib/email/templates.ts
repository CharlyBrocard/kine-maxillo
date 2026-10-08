import type { Appointment } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { practitionerNotificationEmail, siteUrl, type Email } from "@/lib/email/send";
import { buildIcs } from "@/lib/email/ics";

/**
 * Contenu des emails transactionnels. Le motif du RDV n'apparaît dans
 * aucun email (donnée de santé potentielle, voir "Décisions produit"
 * dans PROJECT.md) : la praticienne le consulte dans le backoffice.
 */

type AppointmentForEmail = Pick<
  Appointment,
  "id" | "slotStart" | "category" | "patientName" | "patientEmail" | "patientPhone"
>;

const ICS_NAME = "rendez-vous.ics";

function cabinetAddress(): string {
  return `${siteConfig.adresseLigne1}, ${siteConfig.adresseLigne2}`;
}

/** Même UID pour le patient et la praticienne : un même RDV, deux agendas. */
function eventUid(appointment: AppointmentForEmail): string {
  return `${appointment.id}@kine-maxillo-lyon.com`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function when(appointment: AppointmentForEmail): string {
  const date = formatUTCDate(appointment.slotStart, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${date} à ${formatUTCTime(appointment.slotStart)}`;
}

function summaryLines(appointment: AppointmentForEmail): string[] {
  return [
    when(appointment),
    `${categoryLabel(appointment.category)} · ${SLOT_DURATION_MINUTES} min`,
    `${siteConfig.adresseLigne1}, ${siteConfig.adresseLigne2}`,
  ];
}

type Checklist = { title: string; items: string[] };

/** Gabarit HTML commun : paragraphes (texte brut, échappés ici) + bouton optionnel. */
function layout(opts: {
  paragraphs: string[];
  summary?: string[];
  checklist?: Checklist;
  button?: { label: string; href: string };
  footer?: string;
}): string {
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#23312C">${escapeHtml(text)}</p>`;
  const summary = opts.summary
    ? `<div style="margin:0 0 20px;padding:16px 20px;border-radius:12px;background:#EFEBE2">${opts.summary
        .map(
          (line, i) =>
            `<div style="font-size:${i === 0 ? 17 : 15}px;${i === 0 ? "font-weight:600;" : ""}color:#23312C;line-height:1.5">${escapeHtml(line)}</div>`
        )
        .join("")}</div>`
    : "";
  const checklist = opts.checklist
    ? `<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#23312C">${escapeHtml(opts.checklist.title)}</p><ul style="margin:0 0 20px;padding-left:22px;font-size:16px;line-height:1.6;color:#23312C">${opts.checklist.items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "";
  const button = opts.button
    ? `<p style="margin:0 0 20px"><a href="${escapeHtml(opts.button.href)}" style="display:inline-block;padding:14px 24px;border-radius:10px;background:#3F6F63;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none">${escapeHtml(opts.button.label)}</a></p>`
    : "";
  const footer = opts.footer
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6B7A74">${escapeHtml(opts.footer)}</p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#F6F4EE;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;padding:28px;border-radius:16px;background:#ffffff">${opts.paragraphs
    .slice(0, 1)
    .map(p)
    .join("")}${summary}${checklist}${opts.paragraphs.slice(1).map(p).join("")}${button}<p style="margin:0;font-size:15px;line-height:1.5;color:#23312C">${escapeHtml(siteConfig.praticienne)} — ${escapeHtml(siteConfig.qualification)}<br>${escapeHtml(siteConfig.telephone)}</p>${footer}</div></body></html>`;
}

function signature(): string {
  return `${siteConfig.praticienne} — ${siteConfig.qualification}\n${siteConfig.telephone}`;
}

const NO_REPLY_NEEDED = "Pour toute question, répondez simplement à cet email ou appelez le cabinet.";

/** Au patient, juste après la demande : lien pour valider le RDV. */
export function confirmationRequestEmail(
  appointment: AppointmentForEmail,
  confirmationToken: string
): Email {
  const link = `${siteUrl()}/rendez-vous/confirmation?token=${confirmationToken}`;
  const intro = `Bonjour ${appointment.patientName}, merci pour votre demande de rendez-vous :`;
  const action = `Pour valider ce rendez-vous, cliquez sur le lien ci-dessous dans les ${PENDING_HOLD_MINUTES} minutes. Passé ce délai, le créneau sera libéré.`;
  const ignore = "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.";
  return {
    to: appointment.patientEmail,
    toName: appointment.patientName,
    subject: "Validez votre rendez-vous",
    text: [intro, "", ...summaryLines(appointment), "", action, link, "", ignore, "", signature()].join("\n"),
    html: layout({
      paragraphs: [intro, action],
      summary: summaryLines(appointment),
      button: { label: "Valider mon rendez-vous", href: link },
      footer: ignore,
    }),
  };
}

const PAYMENT_MEANS = "Un moyen de paiement : carte bancaire, espèces ou virement";

/**
 * Documents à apporter. La pressothérapie n'est pas remboursée (acte de
 * confort, voir /tarifs) : seul le moyen de paiement est utile.
 */
function whatToBring(category: AppointmentForEmail["category"]): Checklist {
  const items =
    category === "PRESSOTHERAPIE"
      ? [PAYMENT_MEANS]
      : [
          "Votre carte Vitale",
          "Votre ordonnance",
          "Votre carte de mutuelle",
          PAYMENT_MEANS,
        ];
  return { title: "À apporter le jour du rendez-vous :", items };
}

function checklistText(checklist: Checklist): string[] {
  return [checklist.title, ...checklist.items.map((item) => `- ${item}`)];
}

/** Au patient, une fois le RDV confirmé : récapitulatif, documents à apporter, lien d'annulation. */
export function appointmentConfirmedEmail(
  appointment: AppointmentForEmail,
  cancellationToken: string
): Email {
  const link = `${siteUrl()}/rendez-vous/annule?token=${cancellationToken}`;
  const intro = `Bonjour ${appointment.patientName}, votre rendez-vous est confirmé :`;
  const cancel = "Un empêchement ? Merci d'annuler au plus tôt pour libérer le créneau :";
  const toBring = whatToBring(appointment.category);
  const ics = buildIcs({
    uid: eventUid(appointment),
    start: appointment.slotStart,
    summary: `Kiné — ${siteConfig.praticienne}`,
    location: cabinetAddress(),
    description: [
      categoryLabel(appointment.category),
      siteConfig.indicationAcces,
      siteConfig.telephone,
      `Annuler : ${link}`,
    ].join("\n"),
  });
  const calendarHint = "Le rendez-vous est joint à cet email : ouvrez la pièce jointe pour l'ajouter à votre agenda.";
  const access = `Accès : ${siteConfig.indicationAcces} ${siteConfig.accesPmr}.`;
  return {
    to: appointment.patientEmail,
    toName: appointment.patientName,
    subject: `Rendez-vous confirmé — ${when(appointment)}`,
    text: [intro, "", ...summaryLines(appointment), "", ...checklistText(toBring), "", access, "", calendarHint, "", cancel, link, "", NO_REPLY_NEEDED, "", signature()].join("\n"),
    html: layout({
      paragraphs: [intro, access, calendarHint, cancel],
      summary: summaryLines(appointment),
      checklist: toBring,
      button: { label: "Annuler mon rendez-vous", href: link },
      footer: NO_REPLY_NEEDED,
    }),
    attachments: [{ name: ICS_NAME, content: ics }],
  };
}

/** Au patient, quand la praticienne annule depuis le backoffice. */
export function cancelledByPractitionerEmail(appointment: AppointmentForEmail): Email {
  const intro = `Bonjour ${appointment.patientName}, nous sommes au regret de devoir annuler votre rendez-vous :`;
  const next = `Vous pouvez reprendre rendez-vous en ligne sur ${siteUrl()}/rendez-vous ou en appelant le ${siteConfig.telephone}.`;
  return {
    to: appointment.patientEmail,
    toName: appointment.patientName,
    subject: `Rendez-vous annulé — ${when(appointment)}`,
    text: [intro, "", ...summaryLines(appointment), "", next, "", signature()].join("\n"),
    html: layout({ paragraphs: [intro, next], summary: summaryLines(appointment), footer: NO_REPLY_NEEDED }),
  };
}

function practitionerEmail(
  subject: string,
  intro: string,
  appointment: AppointmentForEmail,
  withCalendar = false
): Email | null {
  const to = practitionerNotificationEmail();
  if (!to) return null;
  const contact = [`${appointment.patientName}`, appointment.patientPhone, appointment.patientEmail];
  const agenda = `Voir l'agenda : ${siteUrl()}/espace/agenda`;
  return {
    to,
    subject,
    text: [intro, "", when(appointment), categoryLabel(appointment.category), "", ...contact, "", agenda].join("\n"),
    html: layout({
      paragraphs: [intro, ...contact],
      summary: [when(appointment), categoryLabel(appointment.category)],
      button: { label: "Ouvrir l'agenda", href: `${siteUrl()}/espace/agenda` },
    }),
    // Sans le motif (donnée de santé) : l'agenda est synchronisé chez Apple/Google.
    ...(withCalendar
      ? {
          attachments: [
            {
              name: ICS_NAME,
              content: buildIcs({
                uid: eventUid(appointment),
                start: appointment.slotStart,
                summary: `${appointment.patientName} — ${categoryLabel(appointment.category)}`,
                location: cabinetAddress(),
                description: [appointment.patientPhone, appointment.patientEmail, `Agenda : ${siteUrl()}/espace/agenda`].join("\n"),
                url: `${siteUrl()}/espace/agenda`,
              }),
            },
          ],
        }
      : {}),
  };
}

/** À la praticienne, à chaque RDV confirmé. null si aucun destinataire n'est configuré. */
export function newAppointmentNotification(appointment: AppointmentForEmail): Email | null {
  return practitionerEmail(
    `Nouveau RDV — ${appointment.patientName}, ${when(appointment)}`,
    "Nouveau rendez-vous confirmé :",
    appointment,
    true
  );
}

/** À la praticienne, quand un patient annule lui-même un RDV confirmé. */
export function patientCancellationNotification(appointment: AppointmentForEmail): Email | null {
  return practitionerEmail(
    `RDV annulé — ${appointment.patientName}, ${when(appointment)}`,
    "Un patient a annulé son rendez-vous, le créneau est de nouveau disponible :",
    appointment
  );
}
