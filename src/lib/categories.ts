import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";

/**
 * Deux catégories de RDV (voir "Décisions produit" dans PROJECT.md) — la
 * disponibilité est gérée séparément par catégorie : un créneau ouvert
 * pour l'une n'est pas proposé pour l'autre.
 */
export const categories = [
  { id: "MAXILLO_FACIAL", label: "Rééducation maxillo-faciale" },
  { id: "PRESSOTHERAPIE", label: "Pressothérapie" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export function categoryLabel(id: CategoryId): string {
  return categories.find((c) => c.id === id)!.label;
}

/**
 * Durée affichée au patient pour une séance de cette catégorie, ou null.
 * La rééducation maxillo-faciale a une durée variable selon la prise en
 * charge : on n'affiche pas la durée du créneau réservé (30 min), qui
 * laisserait croire à une séance de 30 min.
 */
export function sessionDurationLabel(id: CategoryId): string | null {
  return id === "PRESSOTHERAPIE" ? `${SLOT_DURATION_MINUTES} min` : null;
}
