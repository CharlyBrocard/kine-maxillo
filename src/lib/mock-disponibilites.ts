export type JourType = {
  jour: string;
  plages: string[];
  ouvert: boolean;
};

export const semaineType: JourType[] = [
  { jour: "Lundi", plages: ["08:30 – 12:30", "14:00 – 19:00"], ouvert: true },
  { jour: "Mardi", plages: ["08:30 – 12:30", "14:00 – 19:00"], ouvert: true },
  { jour: "Mercredi", plages: ["10:00 – 19:00"], ouvert: true },
  { jour: "Jeudi", plages: [], ouvert: false },
  { jour: "Vendredi", plages: ["08:30 – 16:00"], ouvert: true },
  { jour: "Samedi", plages: ["09:00 – 12:00"], ouvert: true },
];

export type Exception = {
  id: string;
  label: string;
  sublabel: string;
  type: "fermeture" | "ajout";
};

export const exceptionsInitiales: Exception[] = [
  {
    id: "e1",
    label: "Jeu. 27 août — toute la journée",
    sublabel: "Formation ATM · fermé",
    type: "fermeture",
  },
  {
    id: "e2",
    label: "Lun. 31 août — 14:00 à 19:00",
    sublabel: "Rendez-vous personnel · fermé",
    type: "fermeture",
  },
  {
    id: "e3",
    label: "Sam. 5 sept. — 13:00 à 16:00",
    sublabel: "Créneaux ajoutés · rattrapage",
    type: "ajout",
  },
];
