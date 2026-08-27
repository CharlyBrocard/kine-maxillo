"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";

export default function EspaceLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push("/espace/agenda");
    router.refresh();
  }

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
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-[15px] text-body">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="johanna@kine-maxillo-lyon.com"
              className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] text-body">
            Mot de passe
            <div className="flex h-[56px] items-center justify-between rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Connexion…" : "Se connecter"}
          </Button>
        </form>

        <p className="max-w-[380px] text-center text-[13.5px] leading-relaxed text-faint">
          Accès réservé. Les données de santé ne sont pas stockées ici :
          seuls le nom, le contact et le motif du rendez-vous.
        </p>
      </div>
    </div>
  );
}
