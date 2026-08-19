export type RdvStatus = "confirme" | "attente" | "presso" | "vous";

export type Rdv = {
  id: string;
  jour: "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi";
  time: string;
  endTime?: string;
  patient: string;
  motif: string;
  telephone?: string;
  status: RdvStatus;
};

export const jours = [
  { key: "lundi", label: "lundi", numero: 24 },
  { key: "mardi", label: "mardi", numero: 25 },
  { key: "mercredi", label: "mercredi", numero: 26 },
  { key: "jeudi", label: "jeudi", numero: 27, ferme: "Fermé · formation" },
  { key: "vendredi", label: "vendredi", numero: 28 },
] as const;

export const rdvSemaine: Rdv[] = [
  { id: "1", jour: "lundi", time: "08:30", patient: "Paul Vasseur", motif: "ATM — séance 4/10", status: "confirme" },
  { id: "2", jour: "lundi", time: "11:20", patient: "Aïcha Benali", motif: "Post-op épaule", status: "confirme" },
  { id: "3", jour: "lundi", time: "15:30", patient: "Sophie Nguyen", motif: "Pressothérapie 30 min", status: "presso" },

  { id: "4", jour: "mardi", time: "08:30", patient: "Claude Perrin", motif: "Lombalgie", status: "confirme" },
  { id: "5", jour: "mardi", time: "13:00", patient: "Yanis Roux", motif: "En attente de validation email", status: "attente" },
  {
    id: "6",
    jour: "mardi",
    time: "14:30",
    endTime: "15:10",
    patient: "Martine Bernard",
    motif: "Rééducation ATM",
    telephone: "06 12 34 56 78",
    status: "vous",
  },

  { id: "7", jour: "mercredi", time: "10:30", patient: "Denise Fabre", motif: "ATM — bilan initial", status: "confirme" },
  { id: "8", jour: "mercredi", time: "16:30", patient: "Hugo Meyer", motif: "Ligamentoplastie", status: "confirme" },

  { id: "9", jour: "vendredi", time: "09:10", patient: "Nadia Lopes", motif: "Cervicalgie", status: "confirme" },
  { id: "10", jour: "vendredi", time: "16:00", patient: "Léon Girard", motif: "Pressothérapie 30 min", status: "presso" },
];
