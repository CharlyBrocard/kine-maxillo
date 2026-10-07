import { GraphQLError } from "graphql";
import {
  PATIENT_EMAIL_MAX,
  PATIENT_NAME_MAX,
  PATIENT_PHONE_MAX,
  REASON_MAX,
} from "@/lib/input-limits";

/**
 * Validation des entrées publiques de l'API — le formulaire de
 * réservation a ses propres contraintes HTML, mais l'API est appelable
 * directement, donc tout est revérifié ici.
 */

/** Fenêtre maximale d'une requête de créneaux/agenda (limite le coût des requêtes). */
export const MAX_QUERY_RANGE_DAYS = 93;

// Caractères de contrôle, hors \t \n \r (autorisés dans le motif uniquement).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const LINE_BREAKS = /[\t\n\r]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 .\-()]+$/;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

function singleLine(value: string, field: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw badInput(`${field} est obligatoire.`);
  if (trimmed.length > max) throw badInput(`${field} est trop long (${max} caractères max).`);
  if (CONTROL_CHARS.test(trimmed) || LINE_BREAKS.test(trimmed)) {
    throw badInput(`${field} contient des caractères invalides.`);
  }
  return trimmed;
}

export type PatientInput = {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason?: string | null;
};

export function validatePatientInput(input: PatientInput): {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string | null;
} {
  const patientName = singleLine(input.patientName, "Le nom", PATIENT_NAME_MAX);
  if (patientName.length < 2) throw badInput("Le nom est trop court.");

  const patientPhone = singleLine(input.patientPhone, "Le téléphone", PATIENT_PHONE_MAX);
  const phoneDigits = patientPhone.replace(/\D/g, "").length;
  if (!PHONE_PATTERN.test(patientPhone) || phoneDigits < 9 || phoneDigits > 15) {
    throw badInput("Le numéro de téléphone est invalide.");
  }

  const patientEmail = singleLine(input.patientEmail, "L'email", PATIENT_EMAIL_MAX).toLowerCase();
  if (!EMAIL_PATTERN.test(patientEmail)) throw badInput("L'adresse email est invalide.");

  let reason: string | null = input.reason?.trim() || null;
  if (reason) {
    if (reason.length > REASON_MAX) {
      throw badInput(`Le motif est trop long (${REASON_MAX} caractères max).`);
    }
    if (CONTROL_CHARS.test(reason)) throw badInput("Le motif contient des caractères invalides.");
  } else {
    reason = null;
  }

  return { patientName, patientPhone, patientEmail, reason };
}

/** Tokens générés par generateToken() : 32 octets en hexadécimal. */
export function isWellFormedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function assertQueryRange(from: Date, to: Date): void {
  if (to <= from) throw badInput("Période invalide.");
  if (to.getTime() - from.getTime() > MAX_QUERY_RANGE_DAYS * 24 * 60 * 60_000) {
    throw badInput(`Période trop longue (${MAX_QUERY_RANGE_DAYS} jours max).`);
  }
}
