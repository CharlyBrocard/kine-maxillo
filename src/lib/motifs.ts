/**
 * Motifs de consultation proposés pour la catégorie "Rééducation
 * maxillo-faciale" — qui regroupe aussi la rééducation fonctionnelle
 * classique (voir "Contenu métier" dans PROJECT.md). Liste à faire valider
 * par la praticienne : modifier les libellés ici suffit (formulaire et API
 * la partagent).
 *
 * Les identifiants sont envoyés à l'API, seul le libellé est enregistré
 * (dans `Appointment.reason`) : changer un libellé n'affecte pas les RDV
 * existants, retirer un identifiant n'empêche que les nouvelles demandes.
 */
export const maxilloMotifs = [
  { id: "ATM", label: "Douleurs ou blocage de la mâchoire (ATM, craquements, ouverture limitée)" },
  { id: "BRUXISME", label: "Bruxisme, serrement des dents" },
  { id: "CHIRURGIE_ORTHOGNATHIQUE", label: "Avant ou après une chirurgie orthognathique" },
  { id: "TRAUMATISME", label: "Fracture ou traumatisme de la mâchoire ou du visage" },
  {
    id: "DEGLUTITION",
    label: "Troubles de la déglutition ou de la position de la langue (souvent en lien avec un traitement orthodontique)",
  },
  { id: "VENTILATION", label: "Respiration buccale, ventilation" },
  { id: "PARALYSIE_FACIALE", label: "Paralysie faciale" },
  { id: "SUITES_CHIRURGIE_RADIOTHERAPIE", label: "Suites de chirurgie ou de radiothérapie de la face ou du cou" },
  {
    id: "REEDUCATION_FONCTIONNELLE",
    label: "Rééducation fonctionnelle : post-opératoire, traumatologie, dos, épaule, genou…",
  },
  { id: "AUTRE", label: "Autre (à préciser)" },
] as const;

export type MaxilloMotifId = (typeof maxilloMotifs)[number]["id"];

/** Motif pour lequel la précision libre est obligatoire. */
export const MOTIF_AUTRE: MaxilloMotifId = "AUTRE";

export function findMaxilloMotif(id: string) {
  return maxilloMotifs.find((m) => m.id === id);
}

/** Libellé enregistré pour un motif ("Autre" sans la mention "à préciser"). */
export function storedMotifLabel(id: MaxilloMotifId): string {
  return id === MOTIF_AUTRE ? "Autre" : findMaxilloMotif(id)!.label;
}

/**
 * Sépare le motif enregistré ("<motif> — <précision>" en maxillo, la
 * précision seule sinon — voir composeReason dans validation.ts) en motif
 * choisi et commentaire libre, pour l'affichage.
 */
export function splitStoredReason(
  category: "MAXILLO_FACIAL" | "PRESSOTHERAPIE",
  reason: string | null
): { motif: string | null; commentaire: string | null } {
  if (!reason) return { motif: null, commentaire: null };
  if (category !== "MAXILLO_FACIAL") return { motif: null, commentaire: reason };
  const label = maxilloMotifs
    .map((m) => storedMotifLabel(m.id))
    .find((l) => reason === l || reason.startsWith(`${l} — `));
  if (!label) return { motif: null, commentaire: reason };
  const commentaire = reason.slice(label.length).replace(/^ — /, "").trim();
  return { motif: label, commentaire: commentaire || null };
}
