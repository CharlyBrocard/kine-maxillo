/**
 * Données du cabinet (toutes réelles, validées par la praticienne) :
 * identité, coordonnées, numéros professionnels, hébergeur, tarifs.
 */
export const siteConfig = {
  /** URL canonique de production (SEO : canonical, sitemap, données structurées). */
  url: "https://kine-maxillo-lyon.com",

  praticienne: "Johanna Rouzier",
  qualification: "Masseur-kinésithérapeute D.E.",
  ville: "Millery",

  adresseLigne1: "6 Av. Jacques Nemos",
  adresseLigne2: "69390 Millery",
  codePostal: "69390",
  /**
   * Position du cabinet (carte /contact, liens d'itinéraire), d'après la
   * Base Adresse Nationale (api-adresse.data.gouv.fr) pour cette adresse.
   */
  coordonnees: { lat: 45.633522, lon: 4.782243 },
  region: "Auvergne-Rhône-Alpes",
  zone: "Ouest lyonnais",
  accesPmr: "Rez-de-chaussée, accès PMR",
  /** Repère pour trouver l'entrée (email de confirmation). */
  indicationAcces: "L'entrée du cabinet se trouve côté école, et non côté rue.",

  telephone: "04 72 30 74 85",
  telephoneHref: "tel:+33472307485",
  // Redirection OVH vers la Gmail dédiée du cabinet.
  email: "contact@kine-maxillo-lyon.com",

  horaires: [{ jours: "Lundi – Vendredi", plage: "8h30 – 18h00" }],
  /** Mêmes horaires, au format schema.org (données structurées). À garder alignés. */
  horairesStructures: [
    {
      jours: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      ouverture: "08:30",
      fermeture: "18:00",
    },
  ],
  /**
   * Communes proches du cabinet (SEO local : données structurées
   * "areaServed"). À valider — voir étape SEO dans PROJECT.md.
   */
  communesProches: [
    "Millery",
    "Vourles",
    "Charly",
    "Grigny",
    "Montagny",
    "Brignais",
    "Irigny",
    "Saint-Genis-Laval",
    "Chaponost",
    "Oullins-Pierre-Bénite",
    "Lyon",
  ],

  rpps: "10108073874",
  adeli: "697024172",
  siret: "918 797 531 00038",
  assuranceRcp: "La Médicale",

  tarifPresso: "30 €",

  /** Hébergeur du site (mentions légales, politique de confidentialité). */
  hebergeur: {
    nom: "Hostinger International Ltd.",
    adresse: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
    site: "https://www.hostinger.fr",
    localisationServeur: "France (Paris)",
  },
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/specialites", label: "Spécialités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
] as const;
