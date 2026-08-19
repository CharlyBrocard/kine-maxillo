/**
 * V1 : un seul type de créneau/durée (voir "Décisions produit" dans
 * PROJECT.md — pas de distinction 1ère séance / suivi).
 */
export const SLOT_DURATION_MINUTES = 40;

/**
 * Durée de blocage d'un créneau en statut PENDING avant confirmation
 * par email (voir "Règle clé anti double-booking" dans PROJECT.md).
 */
export const PENDING_HOLD_MINUTES = 20;
