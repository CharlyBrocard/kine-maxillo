import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";

export default function AnnulePage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-terracotta-soft">
        <span className="h-[2.5px] w-6.5 bg-danger" />
      </div>
      <h1 className="font-serif text-[29px] leading-tight">
        Votre rendez-vous a bien été annulé
      </h1>
      <p className="text-[17px] leading-relaxed text-body">
        Le créneau est libéré. Un email de confirmation vous a été envoyé.
      </p>
      <div className="flex w-full flex-col gap-2.5 pt-1">
        <ButtonLink href="/rendez-vous" className="w-full">
          Reprendre un rendez-vous
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" className="w-full">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
      <span className="pt-1.5 text-[14.5px] leading-relaxed text-muted">
        Besoin d&apos;un créneau rapidement ? Appelez le{" "}
        {siteConfig.telephone}, un désistement est parfois possible.
      </span>
    </div>
  );
}
