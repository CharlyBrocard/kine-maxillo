/**
 * Données du cabinet. Nom, adresse et téléphone sont réels ; le reste
 * (email, RPPS/ADELI, SIRET, tarif pressothérapie, photos) reste
 * placeholder — voir "Infos encore à récupérer" dans PROJECT.md.
 */
export const siteConfig = {
  praticienne: "Johanna Rouzier",
  qualification: "Masseur-kinésithérapeute D.E.",
  ville: "Millery",

  adresseLigne1: "6 Av. Jacques Nemos",
  adresseLigne2: "69390 Millery",
  zone: "Ouest lyonnais",
  accesPmr: "Rez-de-chaussée, accès PMR",

  telephone: "04 72 30 74 85",
  telephoneHref: "tel:+33472307485",
  // Placeholder — domaine réservé (kine-maxillo-lyon.com), adresse à confirmer.
  email: "contact@kine-maxillo-lyon.com",

  horaires: [{ jours: "Lundi – Vendredi", plage: "8h30 – 18h00" }],

  rpps: "10100200300",
  adeli: "699912345",
  siret: "900 123 456 00019",
  assuranceRcp: "MACSF",

  tarifPresso: "45 €",
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/specialites", label: "Spécialités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
] as const;
