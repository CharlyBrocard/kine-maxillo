"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";

export default function EspaceLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6.5">
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-serif text-2xl">{siteConfig.praticienne}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            Espace praticienne
          </span>
        </div>

        <form
          className="flex w-full flex-col gap-4.5 rounded-2xl border border-border bg-white p-8"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/espace/agenda");
          }}
        >
          <label className="flex flex-col gap-1.5 text-[15px] text-body">
            Email
            <input
              type="email"
              required
              defaultValue=""
              placeholder="lea@cabinet-marchand.fr"
              className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] text-body">
            Mot de passe
            <div className="flex h-[56px] items-center justify-between rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="h-full flex-1 bg-transparent text-[17px] text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[14.5px] font-semibold text-accent"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>
          <Button type="submit">Se connecter</Button>
          <span className="text-center text-[15px] text-muted">
            Mot de passe oublié ?
          </span>
        </form>

        <p className="max-w-[380px] text-center text-[13.5px] leading-relaxed text-faint">
          Accès réservé. Les données de santé ne sont pas stockées ici :
          seuls le nom, le contact et le motif du rendez-vous.
        </p>
      </div>
    </div>
  );
}
