import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { formatDateLongue } from "@/lib/mock-availability";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    time?: string;
    motif?: string;
    nom?: string;
  }>;
}) {
  const params = await searchParams;
  const date = params.date ? formatDateLongue(params.date) : "votre créneau";
  const time = params.time ?? "";
  const motif = params.motif ?? "Consultation";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-accent text-[34px] text-white">
        ✓
      </div>
      <h1 className="font-serif text-[30px] leading-tight">
        Votre rendez-vous est confirmé
      </h1>

      <div className="w-full rounded-2xl bg-sauge p-6 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
            Quand
          </span>
          <span className="font-serif text-2xl">
            {date} {time && `· ${time}`}
          </span>
          <span className="text-[15px] text-[#3B4A44]">
            Durée {siteConfig.dureeSeance} — arrivez 5 min avant
          </span>
        </div>
        <div className="my-3.5 h-px bg-accent/20" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
            Où
          </span>
          <span className="text-[17px] leading-relaxed text-ink">
            Cabinet {siteConfig.praticienne}
            <br />
            {siteConfig.adresseLigne1}, {siteConfig.adresseLigne2}
          </span>
        </div>
        <div className="my-3.5 h-px bg-accent/20" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
            Motif
          </span>
          <span className="text-[17px] text-ink">{motif}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <ButtonLink href="#" className="w-full">
          Ajouter à mon agenda
        </ButtonLink>
        <ButtonLink href="#" variant="secondary" className="w-full">
          Itinéraire vers le cabinet
        </ButtonLink>
      </div>

      <div className="flex w-full flex-col gap-2 border-t border-border-soft pt-4.5">
        <span className="text-[15px] leading-relaxed text-body">
          Un empêchement ? Merci de prévenir au moins 24 h avant.
        </span>
        <Link
          href="/rendez-vous/annule"
          className="text-[16.5px] font-semibold text-danger underline"
        >
          Annuler ce rendez-vous
        </Link>
      </div>
    </div>
  );
}
