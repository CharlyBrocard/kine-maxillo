import Link from "next/link";
import { nav, siteConfig } from "@/lib/site-config";

export function Header({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-soft bg-linen/95 px-6 py-5 backdrop-blur sm:px-12">
      <Link href="/" className="flex flex-col leading-tight">
        <span className="font-serif text-xl">{siteConfig.praticienne}</span>
        <span className="eyebrow">Kinésithérapie · {siteConfig.ville}</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <nav className="flex gap-6 text-base font-medium text-[#3B4A44]">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.href === current
                  ? "border-b-2 border-accent pb-[3px] text-ink"
                  : "text-[#3B4A44] hover:text-accent"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/rendez-vous"
          className="rounded-[10px] bg-accent px-6 py-[15px] text-base font-semibold text-white hover:bg-accent-hover"
        >
          Prendre rendez-vous
        </Link>
      </div>

      <Link
        href="/rendez-vous"
        className="rounded-[10px] bg-accent px-4 py-3 text-sm font-semibold text-white md:hidden"
      >
        RDV
      </Link>
    </header>
  );
}
