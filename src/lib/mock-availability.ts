/**
 * Créneaux fictifs pour la démo du parcours de prise de RDV.
 * En production, remplacés par availableSlots(from, to) côté GraphQL
 * (voir PROJECT.md — modèle AvailabilityRule / AvailabilityException).
 */
export const motifs = [
  { id: "atm", label: "Rééducation ATM", duree: "40 min" },
  { id: "fonctionnelle", label: "Rééducation fonctionnelle", duree: "40 min" },
  { id: "pressotherapie", label: "Pressothérapie", duree: "30 min" },
] as const;

export type MotifId = (typeof motifs)[number]["id"];

export type DaySlots = {
  date: string;
  jour: string;
  numero: number;
  ferme?: boolean;
  fermeRaison?: string;
  creneaux: string[];
};

export const semaineDemo: DaySlots[] = [
  { date: "2026-08-24", jour: "lundi", numero: 24, creneaux: ["09:50", "16:10"] },
  {
    date: "2026-08-25",
    jour: "mardi",
    numero: 25,
    creneaux: ["08:30", "11:20", "14:30", "17:30"],
  },
  {
    date: "2026-08-26",
    jour: "mercredi",
    numero: 26,
    creneaux: ["10:30", "15:50", "18:10"],
  },
  {
    date: "2026-08-27",
    jour: "jeudi",
    numero: 27,
    ferme: true,
    fermeRaison: "Cabinet fermé",
    creneaux: [],
  },
  {
    date: "2026-08-28",
    jour: "vendredi",
    numero: 28,
    creneaux: ["09:10", "12:00", "14:30"],
  },
];

export function formatDateLongue(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
