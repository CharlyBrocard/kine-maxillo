import { Suspense } from "react";
import { ConfirmationClient } from "@/components/booking/ConfirmationClient";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-white p-9 text-center">
          <p className="text-body">Chargement…</p>
        </div>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
