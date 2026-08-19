/**
 * Motifs de consultation proposés dans le formulaire de RDV — purement
 * informatifs (préremplissent le champ `reason`). Un seul type de
 * créneau/durée en V1 (voir "Décisions produit" dans PROJECT.md) : la
 * durée réelle vient de SLOT_DURATION_MINUTES, pas du motif choisi.
 */
export const motifs = [
  { id: "atm", label: "Rééducation ATM" },
  { id: "fonctionnelle", label: "Rééducation fonctionnelle" },
  { id: "pressotherapie", label: "Pressothérapie" },
] as const;

export type MotifId = (typeof motifs)[number]["id"];
