/**
 * Envoi d'emails transactionnels via l'API Brevo (voir "Stack technique"
 * dans PROJECT.md). Sans BREVO_API_KEY hors production (dev, tests), les
 * emails ne partent pas : ils sont affichés dans la console et gardés
 * dans `devOutbox` (lu par les tests). En production, une configuration
 * incomplète fait échouer l'envoi plutôt que de perdre l'email en silence.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type Email = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
};

export const devOutbox: Email[] = [];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} n'est pas configuré (voir .env.example).`);
  return value;
}

export async function sendEmail(email: Email): Promise<void> {
  // Jamais d'envoi réel pendant les tests, même si BREVO_API_KEY traîne
  // dans l'environnement : le client Prisma charge le .env du projet (où
  // est la vraie clé) — des tests ont déjà envoyé de vrais emails ainsi.
  const apiKey = process.env.NODE_ENV === "test" ? undefined : process.env.BREVO_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BREVO_API_KEY n'est pas configuré (voir .env.example).");
    }
    devOutbox.push(email);
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email non envoyé — pas de BREVO_API_KEY] À : ${email.to}\nObjet : ${email.subject}\n\n${email.text}\n`);
    }
    return;
  }

  const replyTo = process.env.EMAIL_REPLY_TO;
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: requiredEnv("EMAIL_FROM"), name: process.env.EMAIL_FROM_NAME },
      to: [{ email: email.to, name: email.toName }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Pas le corps de l'email dans les logs (données patient) : statut + réponse Brevo.
    throw new Error(`Brevo a refusé l'envoi (${response.status}) : ${await response.text()}`);
  }
}

/** Pour les emails non critiques (notifications) : un échec ne doit pas faire échouer l'action. */
export async function sendEmailSafely(email: Email): Promise<void> {
  try {
    await sendEmail(email);
  } catch (e) {
    console.error(`Échec d'envoi d'email (« ${email.subject} ») :`, e);
  }
}

/** URL publique du site, pour les liens des emails. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Destinataire des notifications de la praticienne (nouveaux RDV, annulations). */
export function practitionerNotificationEmail(): string | undefined {
  return process.env.PRACTITIONER_NOTIFICATION_EMAIL || undefined;
}
