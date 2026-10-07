import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-linen">
      <header className="flex items-center justify-between border-b border-border-soft px-6 py-5 sm:px-12">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-serif text-xl">{siteConfig.praticienne}</span>
          <span className="eyebrow">Kinésithérapie · {siteConfig.ville}</span>
        </Link>
        <div className="flex items-center gap-3 text-base text-body sm:gap-6">
          <span className="hidden sm:inline">Besoin d&apos;aide ?</span>
          <a href={siteConfig.telephoneHref} className="font-semibold text-ink">
            {siteConfig.telephone}
          </a>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-6 py-11 sm:px-12">
        {children}
      </main>
    </div>
  );
}
