/**
 * Longueurs max des champs patient — partagées entre l'API
 * (src/lib/validation.ts) et le formulaire de réservation (client).
 */
export const PATIENT_NAME_MAX = 100;
export const PATIENT_PHONE_MAX = 20;
export const PATIENT_EMAIL_MAX = 254;
/** Motif enregistré complet : "<motif choisi> — <précision>". */
export const REASON_MAX = 1000;
/** Précision libre saisie par le patient (le reste de REASON_MAX va au libellé du motif). */
export const REASON_PRECISION_MAX = 800;
