/**
 * Données du cabinet — placeholders repris de la maquette design.
 * À remplacer par les vraies informations avant mise en production
 * (voir "Infos encore à récupérer" dans PROJECT.md : nom, adresse,
 * RPPS/ADELI, SIRET, tarif pressothérapie, photos).
 */
export const siteConfig = {
  praticienne: "Léa Marchand",
  qualification: "Masseur-kinésithérapeute D.E.",
  ville: "Lyon 6e",

  adresseLigne1: "18 rue Vendôme",
  adresseLigne2: "69006 Lyon",
  metro: "Métro A — Foch",
  accesPmr: "Rez-de-chaussée, accès PMR",

  telephone: "04 78 00 00 00",
  telephoneHref: "tel:+33478000000",
  email: "contact@cabinet-marchand.fr",

  horaires: [
    { jours: "Lundi – Vendredi", plage: "8h30 – 19h00" },
    { jours: "Samedi", plage: "9h00 – 12h00" },
  ],

  rpps: "10100200300",
  adeli: "699912345",
  siret: "900 123 456 00019",
  assuranceRcp: "MACSF",

  tarifPresso: "45 €",
  dureeSeance: "40 min",
  dureePresso: "30 min",
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/specialites", label: "Spécialités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
] as const;
