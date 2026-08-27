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
