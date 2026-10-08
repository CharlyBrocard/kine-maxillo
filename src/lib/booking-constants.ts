/**
 * Durée fixe de tous les créneaux, quelle que soit la catégorie (voir
 * "Décisions produit" dans PROJECT.md).
 */
export const SLOT_DURATION_MINUTES = 30;

/**
 * Durée de blocage d'un créneau en statut PENDING avant confirmation
 * par email (voir "Règle clé anti double-booking" dans PROJECT.md).
 */
export const PENDING_HOLD_MINUTES = 20;

/**
 * Délai de conservation du motif après la fin du RDV (donnée de santé
 * potentielle, voir "Décisions produit" dans PROJECT.md). Les RDV annulés
 * ou expirés perdent leur motif immédiatement.
 */
export const REASON_RETENTION_DAYS = 30;

/**
 * Conservation des RDV (coordonnées patient comprises) — affichée dans la
 * politique de confidentialité (/confidentialite) : les demandes jamais
 * confirmées sont supprimées UNCONFIRMED_RETENTION_DAYS jours après leur
 * création, tous les autres RDV APPOINTMENT_RETENTION_DAYS jours après leur
 * date. Le dossier patient est tenu ailleurs (logiciel de la praticienne).
 */
export const UNCONFIRMED_RETENTION_DAYS = 30;
export const APPOINTMENT_RETENTION_DAYS = 365;
