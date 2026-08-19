import { Header } from "@/components/marketing/Header";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

function Bullet({ children, tone = "sauge" }: { children: React.ReactNode; tone?: "sauge" | "terracotta" }) {
  return (
    <div className="flex gap-3 text-[17px] text-[#3B4A44]">
      <span className={tone === "sauge" ? "text-accent" : "text-terracotta"}>
        —
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function SpecialitesPage() {
  return (
    <div className="flex flex-col">
      <Header current="/specialites" />

      <section className="bg-cream px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <h1 className="max-w-3xl text-balance font-serif text-4xl leading-tight sm:text-5xl">
            Ce que je prends en charge
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-body">
            Trois domaines complémentaires. Si vous hésitez sur le motif de
            consultation, appelez le cabinet : nous en parlons avant de fixer
            un rendez-vous.
          </p>
        </div>
      </section>

      <section
        id="oro-maxillo-facial"
        className="border-b border-border-soft px-6 py-14 sm:px-12 sm:py-16"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4.5">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sauge font-mono text-accent">
                01
              </span>
              <h2 className="font-serif text-3xl">
                Rééducation oro-maxillo-faciale
              </h2>
            </div>
            <p className="text-[17.5px] leading-relaxed text-body">
              L&apos;articulation temporo-mandibulaire est sollicitée des
              milliers de fois par jour. Quand elle se dérègle, la douleur
              peut irradier vers l&apos;oreille, la nuque, les tempes. La
              rééducation combine thérapie manuelle douce, exercices de
              mobilité et travail sur les habitudes de mastication et de
              ventilation.
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <Bullet>
                Douleurs et craquements de l&apos;ATM, blocages, limitation
                d&apos;ouverture
              </Bullet>
              <Bullet>Bruxisme, tensions liées au stress</Bullet>
              <Bullet>
                Suites de chirurgie orthognathique et de traitement
                orthodontique
              </Bullet>
              <Bullet>
                Troubles de la déglutition, respiration buccale, paralysie
                faciale
              </Bullet>
            </div>
            <div className="rounded-xl bg-sauge px-6 py-5 text-[16.5px] leading-relaxed text-sauge-ink">
              Sur prescription médicale. Prise en charge par l&apos;Assurance
              Maladie, tarif conventionné secteur 1.
            </div>
          </div>
          <PhotoPlaceholder
            label="séance ATM / thérapie manuelle"
            className="h-72 sm:h-[440px]"
          />
        </div>
      </section>

      <section
        id="reeducation-fonctionnelle"
        className="border-b border-border-soft px-6 py-14 sm:px-12 sm:py-16"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-2">
          <PhotoPlaceholder
            label="salle de rééducation"
            className="order-2 h-72 sm:h-96 md:order-1"
          />
          <div className="order-1 flex flex-col gap-4.5 md:order-2">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sauge font-mono text-accent">
                02
              </span>
              <h2 className="font-serif text-3xl">Rééducation fonctionnelle</h2>
            </div>
            <p className="text-[17.5px] leading-relaxed text-body">
              Retrouver la mobilité, la force et la confiance dans le
              mouvement, à votre rythme. Un bilan initial fixe des objectifs
              concrets, réévalués au fil des séances.
            </p>
            <div className="flex flex-col gap-2.5">
              <Bullet>
                Post-opératoire : prothèse de hanche ou de genou,
                ligamentoplastie, chirurgie de l&apos;épaule
              </Bullet>
              <Bullet>
                Traumatologie : entorses, fractures, tendinopathies
              </Bullet>
              <Bullet>
                Douleurs chroniques du rachis, cervicalgies, lombalgies
              </Bullet>
            </div>
          </div>
        </div>
      </section>

      <section id="drainage-lymphatique" className="px-6 py-14 sm:px-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4.5">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-soft font-mono text-terracotta">
                03
              </span>
              <h2 className="font-serif text-3xl">
                Drainage lymphatique — pressothérapie
              </h2>
            </div>
            <p className="text-[17.5px] leading-relaxed text-body">
              Des bottes gonflables exercent une pression rythmée sur les
              jambes pour relancer la circulation lymphatique. Confortable,
              passif : vous êtes allongée, la séance dure 30 minutes.
            </p>
            <div className="flex flex-col gap-2.5">
              <Bullet tone="terracotta">
                Jambes lourdes, œdèmes, insuffisance veineuse
              </Bullet>
              <Bullet tone="terracotta">Récupération sportive</Bullet>
              <Bullet tone="terracotta">Sans prescription — voir les tarifs</Bullet>
            </div>
            <div className="pt-1.5">
              <ButtonLink href="/tarifs">Réserver une séance</ButtonLink>
            </div>
          </div>
          <PhotoPlaceholder
            label="bottes de pressothérapie"
            tone="terracotta"
            className="h-72 sm:h-[340px]"
          />
        </div>
      </section>
    </div>
  );
}
