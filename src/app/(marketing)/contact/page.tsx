import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { ButtonLink } from "@/components/ui/Button";
import { MapPlaceholder } from "@/components/marketing/MapPlaceholder";
import { siteConfig } from "@/lib/site-config";

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );
}

export const metadata: Metadata = {
  title: "Contact et accès au cabinet",
  description: `Cabinet de kinésithérapie maxillo-faciale : ${siteConfig.adresseLigne1}, ${siteConfig.adresseLigne2}. ${siteConfig.accesPmr}. Téléphone ${siteConfig.telephone}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <Header current="/contact" />

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col gap-6.5">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              Le cabinet
            </h1>

            <div className="flex flex-col gap-5">
              <InfoBlock label="Adresse">
                <span className="text-lg leading-snug">
                  {siteConfig.adresseLigne1}
                  <br />
                  {siteConfig.adresseLigne2}
                </span>
                <span className="text-base text-ink">{siteConfig.indicationAcces}</span>
                <span className="text-base text-muted">
                  {siteConfig.zone} · {siteConfig.accesPmr}
                </span>
              </InfoBlock>

              <InfoBlock label="Téléphone">
                <span className="text-[22px] font-semibold">
                  {siteConfig.telephone}
                </span>
                <span className="text-base text-muted">
                  Répondeur en dehors des heures de consultation
                </span>
              </InfoBlock>

              <InfoBlock label="Email">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-lg underline decoration-border-strong underline-offset-4 hover:text-accent"
                >
                  {siteConfig.email}
                </a>
              </InfoBlock>

              <InfoBlock label="Horaires">
                <span className="text-[18px] leading-relaxed">
                  {siteConfig.horaires.map((h) => (
                    <span key={h.jours} className="block">
                      {h.jours} · {h.plage}
                    </span>
                  ))}
                </span>
              </InfoBlock>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/rendez-vous">Prendre rendez-vous</ButtonLink>
              <ButtonLink href={siteConfig.telephoneHref} variant="secondary">
                Appeler
              </ButtonLink>
            </div>
          </div>

          <MapPlaceholder />
        </div>
      </section>
    </div>
  );
}
