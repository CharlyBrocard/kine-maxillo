import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { siteConfig } from "@/lib/site-config";
import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";

const axes = [
  {
    n: "01",
    tone: "sauge" as const,
    title: "Oro-maxillo-facial",
    text: "Douleurs et blocages de l'ATM, bruxisme, suites de chirurgie orthognathique, troubles de la déglutition et de la ventilation.",
    href: "/specialites#oro-maxillo-facial",
  },
  {
    n: "02",
    tone: "sauge" as const,
    title: "Rééducation fonctionnelle",
    text: "Suites opératoires, traumatologie, entorses et fractures, douleurs musculosquelettiques du dos, de l'épaule ou du genou.",
    href: "/specialites#reeducation-fonctionnelle",
  },
  {
    n: "03",
    tone: "terracotta" as const,
    title: "Drainage lymphatique",
    text: `Pressothérapie par bottes : jambes lourdes, œdèmes, récupération. Séance de ${SLOT_DURATION_MINUTES} min, ${siteConfig.tarifPresso}.`,
    href: "/tarifs",
  },
];

export default function AccueilPage() {
  return (
    <div className="flex flex-col">
      <Header current="/" />

      <section className="bg-gradient-to-b from-cream to-linen px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Pill>Rééducation oro-maxillo-faciale</Pill>
            <h1 className="text-balance font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              Retrouver une mâchoire libre, un corps qui bouge sans douleur.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-body">
              Prise en charge des douleurs de l&apos;ATM, des troubles de la
              sphère oro-faciale et du drainage lymphatique, au cabinet de{" "}
              {siteConfig.ville}, dans l&apos;{siteConfig.zone.toLowerCase()}.
              Un accompagnement calme, progressif, adapté à chacun.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <ButtonLink href="/rendez-vous" size="lg">
                Prendre rendez-vous
              </ButtonLink>
              <ButtonLink href={siteConfig.telephoneHref} variant="secondary" size="lg">
                {siteConfig.telephone}
              </ButtonLink>
            </div>
            <div className="flex flex-wrap gap-7 pt-1.5 text-[15px] text-muted">
              <span>
                Cabinet accessible · {siteConfig.ville}, {siteConfig.zone}
              </span>
              <span>Conventionné secteur 1</span>
            </div>
          </div>
          <PhotoPlaceholder
            label="photo cabinet / praticienne"
            className="h-72 sm:h-[460px]"
          />
        </div>
      </section>

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-9">
          <div className="flex max-w-xl flex-col gap-2.5">
            <span className="eyebrow">Prises en charge</span>
            <h2 className="font-serif text-3xl sm:text-4xl">
              Trois axes de soin
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {axes.map((axe) => (
              <div
                key={axe.n}
                className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-8"
              >
                <div
                  className={`flex h-[46px] w-[46px] items-center justify-center rounded-xl font-mono text-[15px] font-medium ${
                    axe.tone === "sauge"
                      ? "bg-sauge text-accent"
                      : "bg-terracotta-soft text-terracotta"
                  }`}
                >
                  {axe.n}
                </div>
                <h3 className="font-serif text-2xl leading-tight">
                  {axe.title}
                </h3>
                <p className="text-[16.5px] leading-relaxed text-body">
                  {axe.text}
                </p>
                <Link
                  href={axe.href}
                  className={`mt-1 text-base font-semibold ${
                    axe.tone === "sauge" ? "text-accent" : "text-terracotta"
                  }`}
                >
                  En savoir plus →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sable px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <PhotoPlaceholder label="portrait praticienne" className="h-72 sm:h-[380px]" />
          <div className="flex flex-col gap-5">
            <span className="eyebrow">À propos</span>
            <h3 className="text-balance font-serif text-3xl leading-tight sm:text-4xl">
              Quatre ans de pratique, une spécialisation rare dans
              l&apos;ouest lyonnais.
            </h3>
            <p className="max-w-xl text-[17.5px] leading-relaxed text-body">
              Diplômée d&apos;État, formée à la rééducation maxillo-faciale et
              à la thérapie manuelle, je travaille en lien étroit avec les
              chirurgiens maxillo-faciaux, orthodontistes et ORL de la
              région. Chaque séance dure {SLOT_DURATION_MINUTES} min, en
              cabinet individuel.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                ["4 ans", "de pratique"],
                [`${SLOT_DURATION_MINUTES} min`, "par séance"],
                [siteConfig.ville, siteConfig.zone],
              ].map(([big, small]) => (
                <div
                  key={big}
                  className="flex min-w-[150px] flex-col gap-1 rounded-xl bg-linen px-6 py-4.5"
                >
                  <span className="font-serif text-[28px]">{big}</span>
                  <span className="text-sm text-muted">{small}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 px-6 py-20 text-center sm:px-12 sm:py-24">
        <h3 className="max-w-xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
          Réservez votre créneau en deux minutes
        </h3>
        <p className="max-w-lg text-lg leading-relaxed text-body">
          Aucun compte à créer : choisissez un créneau, confirmez par email,
          votre rendez-vous est pris.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <ButtonLink href="/rendez-vous" size="lg">
            Prendre rendez-vous
          </ButtonLink>
          <ButtonLink href={siteConfig.telephoneHref} variant="secondary" size="lg">
            {siteConfig.telephone}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
