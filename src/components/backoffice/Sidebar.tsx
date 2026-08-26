"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

const links = [
  { href: "/espace/agenda", label: "Agenda" },
  { href: "/espace/disponibilites", label: "Disponibilités" },
  { href: "/espace/patients", label: "Patients" },
  { href: "/espace/reglages", label: "Réglages" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[240px] shrink-0 flex-col gap-6.5 bg-ink px-5 py-6.5 text-[#D6DDD9]">
      <div className="flex flex-col gap-1">
        <span className="font-serif text-lg text-white">
          {siteConfig.praticienne}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8DA39B]">
          Espace praticienne
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                "rounded-[10px] px-3.5 py-3 text-base " +
                (active
                  ? "bg-ink-soft font-semibold text-white"
                  : "text-[#D6DDD9] hover:bg-ink-soft/60")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/espace" })}
          className="text-left text-sm text-[#8DA39B] hover:text-white"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
