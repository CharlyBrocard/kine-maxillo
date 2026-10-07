import { siteConfig } from "@/lib/site-config";
import { categories } from "@/lib/categories";

/**
 * Données structurées schema.org du cabinet (SEO local, voir "Priorités
 * absolues" dans PROJECT.md). Physiotherapy est un sous-type de
 * LocalBusiness/MedicalBusiness, reconnu par Google pour les fiches
 * d'établissement locales.
 */
export function cabinetJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Physiotherapy",
    "@id": `${siteConfig.url}/#cabinet`,
    name: `${siteConfig.praticienne} — Kinésithérapie maxillo-faciale`,
    description:
      "Rééducation oro-maxillo-faciale (ATM, bruxisme, suites de chirurgie orthognathique), rééducation fonctionnelle et drainage lymphatique par pressothérapie.",
    url: siteConfig.url,
    telephone: siteConfig.telephoneHref.replace("tel:", ""),
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.adresseLigne1,
      postalCode: siteConfig.codePostal,
      addressLocality: siteConfig.ville,
      addressRegion: siteConfig.region,
      addressCountry: "FR",
    },
    openingHoursSpecification: siteConfig.horairesStructures.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.jours,
      opens: h.ouverture,
      closes: h.fermeture,
    })),
    areaServed: siteConfig.communesProches.map((name) => ({ "@type": "City", name })),
    founder: {
      "@type": "Person",
      name: siteConfig.praticienne,
      jobTitle: siteConfig.qualification,
    },
    availableService: [
      ...categories.map((c) => ({ "@type": "MedicalTherapy", name: c.label })),
      { "@type": "MedicalTherapy", name: "Rééducation fonctionnelle" },
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: `${siteConfig.url}/rendez-vous`,
      name: "Prendre rendez-vous en ligne",
    },
  };
}
