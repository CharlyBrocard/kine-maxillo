import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { siteConfig } from "@/lib/site-config";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="flex scroll-mt-24 flex-col gap-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="flex flex-col gap-2 text-[16.5px] leading-relaxed text-body">
        {children}
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales et politique de confidentialité du site de ${siteConfig.praticienne}, kinésithérapeute à ${siteConfig.ville}.`,
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex flex-col">
      <Header />

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
            Mentions légales
          </h1>

          <Section title="Éditeur du site">
            <p>
              {siteConfig.praticienne} — {siteConfig.qualification}
            </p>
            <p>
              N° RPPS {siteConfig.rpps} — N° ADELI {siteConfig.adeli}
            </p>
            <p>SIRET {siteConfig.siret}</p>
            <p>
              {siteConfig.adresseLigne1}, {siteConfig.adresseLigne2}
            </p>
            <p>
              {siteConfig.telephone} — {siteConfig.email}
            </p>
            <p>Assurance responsabilité civile professionnelle : {siteConfig.assuranceRcp}</p>
            <p>
              Membre de l&apos;Ordre des masseurs-kinésithérapeutes,
              soumis(e) au code de déontologie de la profession.
            </p>
          </Section>

          <Section title="Hébergement">
            <p>
              Site hébergé par un prestataire dont les coordonnées seront
              précisées ici avant mise en ligne.
            </p>
          </Section>

          <Section id="confidentialite" title="Politique de confidentialité">
            <p>
              Les données collectées lors de la prise de rendez-vous, leurs
              durées de conservation et vos droits sont détaillés dans la{" "}
              <Link href="/confidentialite" className="underline underline-offset-4">
                politique de confidentialité
              </Link>
              .
            </p>
          </Section>

          <Section id="accessibilite" title="Accessibilité">
            <p>
              Le cabinet est accessible aux personnes à mobilité réduite
              (rez-de-chaussée). La déclaration d&apos;accessibilité
              numérique du site sera complétée avant mise en production.
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}
