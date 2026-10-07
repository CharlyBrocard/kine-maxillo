import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnuleClient } from "@/components/booking/AnnuleClient";

/** Page à token (lien reçu par email) : jamais indexée, aussi exclue dans robots.ts. */
export const metadata: Metadata = {
  title: "Annulation du rendez-vous",
  robots: { index: false, follow: false },
};

export default function AnnulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-white p-9 text-center">
          <p className="text-body">Chargement…</p>
        </div>
      }
    >
      <AnnuleClient />
    </Suspense>
  );
}
