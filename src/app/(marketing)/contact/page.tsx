import { Header } from "@/components/marketing/Header";
import { ButtonLink } from "@/components/ui/Button";
import { ContactForm } from "@/components/marketing/ContactForm";
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
                <span className="text-lg">{siteConfig.email}</span>
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

          <div className="flex flex-col gap-5">
            <MapPlaceholder />
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
