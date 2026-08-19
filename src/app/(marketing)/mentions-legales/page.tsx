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
              Les données transmises via le formulaire de contact et le
              parcours de prise de rendez-vous (nom, téléphone, email et,
              le cas échéant, motif de consultation) sont utilisées
              exclusivement pour la gestion des rendez-vous et ne sont ni
              cédées ni utilisées à des fins commerciales.
            </p>
            <p>
              Le motif de consultation, susceptible de révéler des
              informations de santé, est conservé pour la durée strictement
              nécessaire au suivi du rendez-vous puis purgé.
            </p>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit
              d&apos;accès, de rectification et de suppression de vos
              données en écrivant à {siteConfig.email}.
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
