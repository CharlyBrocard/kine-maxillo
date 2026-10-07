import type { Metadata } from "next";

/** Backoffice : jamais indexé (aussi exclu dans robots.ts). */
export const metadata: Metadata = {
  title: "Espace praticienne",
  robots: { index: false, follow: false },
};

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
