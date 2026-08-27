import { Header } from "@/components/marketing/Header";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";

export default function TarifsPage() {
  return (
    <div className="flex flex-col">
      <Header current="/tarifs" />

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-9">
          <div className="flex max-w-2xl flex-col gap-3.5">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              Tarifs
            </h1>
            <p className="text-lg leading-relaxed text-body">
              Les séances de rééducation sur prescription médicale sont
              réglées au tarif conventionné et remboursées par
              l&apos;Assurance Maladie. La pressothérapie, acte de confort,
              est à tarif libre.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4.5 rounded-2xl border-2 border-terracotta bg-white p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-terracotta uppercase">
                    Sans prescription
                  </span>
                  <h2 className="font-serif text-[28px] leading-tight">
                    Drainage lymphatique par pressothérapie
                  </h2>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-serif text-5xl leading-none">
                    {siteConfig.tarifPresso}
                  </span>
                  <span className="text-sm text-muted">
                    la séance de {SLOT_DURATION_MINUTES} min
                  </span>
                </div>
              </div>
              <div className="h-px bg-border-soft" />
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-3 text-[17px] text-[#3B4A44]">
                  <span className="text-terracotta">—</span>
                  <span>Réglable par carte, espèces ou chèque</span>
                </div>
                <div className="flex gap-3 text-[17px] text-[#3B4A44]">
                  <span className="text-terracotta">—</span>
                  <span>
                    Non remboursé par l&apos;Assurance Maladie ; certaines
                    mutuelles participent
                  </span>
                </div>
                <div className="flex gap-3 text-[17px] text-[#3B4A44]">
                  <span className="text-terracotta">—</span>
                  <span>Forfait 5 séances possible, à demander au cabinet</span>
                </div>
              </div>
              <ButtonLink href="/rendez-vous?category=PRESSOTHERAPIE" className="mt-auto">
                Réserver une séance de pressothérapie
              </ButtonLink>
            </div>

            <div className="flex flex-col gap-4.5 rounded-2xl bg-sable p-9">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] tracking-[0.14em] text-faint uppercase">
                  Sur prescription
                </span>
                <h2 className="font-serif text-[28px] leading-tight">
                  Rééducation oro-maxillo-faciale &amp; fonctionnelle
                </h2>
              </div>
              <p className="text-[17.5px] leading-relaxed text-body">
                Tarif conventionné secteur 1, sans dépassement
                d&apos;honoraires. Le montant dépend du nombre d&apos;actes
                prescrits : nous l&apos;établissons ensemble lors du bilan
                initial.
              </p>
              <div className="flex flex-col gap-1.5 rounded-xl bg-linen p-5.5">
                <span className="font-serif text-[26px]">Sur devis</span>
                <span className="text-base leading-relaxed text-body">
                  Appelez le cabinet ou écrivez-nous : réponse sous 24 h
                  ouvrées.
                </span>
              </div>
              <ButtonLink href="/contact" variant="secondary" className="mt-auto">
                Nous contacter
              </ButtonLink>
            </div>
          </div>

          <div className="max-w-3xl rounded-xl bg-sauge px-6.5 py-5.5 text-[16.5px] leading-relaxed text-sauge-ink">
            Un rendez-vous non annulé 24 h à l&apos;avance pourra être
            facturé. Vous pouvez annuler en un clic depuis l&apos;email de
            confirmation.
          </div>
        </div>
      </section>
    </div>
  );
}
