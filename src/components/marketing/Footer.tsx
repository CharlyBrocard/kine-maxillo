import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="flex flex-col gap-8 bg-ink px-6 py-11 text-[#D6DDD9] sm:px-12">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="font-serif text-xl text-white">
            {siteConfig.praticienne}
          </span>
          <span className="text-[15px] leading-relaxed">
            {siteConfig.qualification}
            <br />
            Rééducation oro-maxillo-faciale
          </span>
        </div>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
          <span className="eyebrow text-[#8DA39B]">Cabinet</span>
          <span>
            {siteConfig.adresseLigne1}
            <br />
            {siteConfig.adresseLigne2}
          </span>
          <span>{siteConfig.telephone}</span>
        </div>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
          <span className="eyebrow text-[#8DA39B]">Horaires</span>
          {siteConfig.horaires.map((h) => (
            <span key={h.jours}>
              {h.jours} · {h.plage}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#3A4A44] pt-5 text-[13px] text-[#8DA39B]">
        <span>
          RPPS {siteConfig.rpps} · ADELI {siteConfig.adeli} · SIRET{" "}
          {siteConfig.siret}
        </span>
        <span className="flex gap-5">
          <Link href="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
          <Link href="/mentions-legales#confidentialite" className="hover:text-white">
            Politique de confidentialité
          </Link>
          <Link href="/mentions-legales#accessibilite" className="hover:text-white">
            Accessibilité
          </Link>
        </span>
      </div>
    </footer>
  );
}
