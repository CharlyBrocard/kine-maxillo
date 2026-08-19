"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Stepper } from "@/components/booking/Stepper";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import {
  formatDateLongue,
  motifs,
  semaineDemo,
  type MotifId,
} from "@/lib/mock-availability";

type Step = 1 | 2 | 3;

export function BookingWizard({ motifInitial }: { motifInitial?: MotifId }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [motifId, setMotifId] = useState<MotifId>(motifInitial ?? "atm");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [resent, setResent] = useState(false);

  const motif = motifs.find((m) => m.id === motifId)!;

  const selection = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    return `${formatDateLongue(selectedDate)} à ${selectedTime} — ${motif.duree}`;
  }, [selectedDate, selectedTime, motif]);

  function goToConfirmation() {
    const params = new URLSearchParams({
      date: selectedDate ?? "",
      time: selectedTime ?? "",
      motif: motif.label,
      nom,
    });
    router.push(`/rendez-vous/confirmation?${params.toString()}`);
  }

  return (
    <div className="flex w-full max-w-[1000px] flex-col items-center gap-8">
      <Stepper current={step} />

      {step === 1 && (
        <div className="grid w-full gap-7 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-8">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-serif text-3xl">Choisissez un créneau</h1>
              <p className="text-base text-body">
                Les horaires affichés sont réellement disponibles.
              </p>
            </div>

            <label className="flex max-w-sm flex-col gap-1.5 text-[14.5px] text-body">
              Motif de consultation
              <select
                value={motifId}
                onChange={(e) => {
                  setMotifId(e.target.value as MotifId);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
                className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
              >
                {motifs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.duree}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3 overflow-x-auto sm:grid-cols-3 lg:grid-cols-5">
              {semaineDemo.map((jour) => (
                <div key={jour.date} className="flex flex-col gap-2.5">
                  <div
                    className={
                      "rounded-[10px] py-2.5 text-center " +
                      (jour.date === selectedDate ? "bg-sauge" : "bg-cream")
                    }
                  >
                    <div className="text-[13px] text-muted">{jour.jour}</div>
                    <div className="text-lg font-semibold">{jour.numero}</div>
                  </div>
                  {jour.ferme ? (
                    <div className="rounded-[10px] border-[1.5px] border-dashed border-border-strong px-2 py-4 text-center text-[14.5px] leading-tight text-faint">
                      {jour.fermeRaison}
                    </div>
                  ) : (
                    jour.creneaux.map((heure) => {
                      const selected =
                        jour.date === selectedDate && heure === selectedTime;
                      return (
                        <button
                          key={heure}
                          type="button"
                          onClick={() => {
                            setSelectedDate(jour.date);
                            setSelectedTime(heure);
                          }}
                          className={
                            "flex h-[52px] items-center justify-center rounded-[10px] text-[16.5px] font-semibold transition-colors " +
                            (selected
                              ? "border-2 border-accent bg-sauge text-sauge-ink"
                              : "border-[1.5px] border-border-input bg-white text-ink hover:border-accent")
                          }
                        >
                          {heure}
                        </button>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-sable p-7">
            <span className="eyebrow">Votre sélection</span>
            {selection ? (
              <div className="flex flex-col gap-1">
                <span className="font-serif text-[25px] leading-tight">
                  {formatDateLongue(selectedDate!)}
                  <br />
                  {selectedTime}
                </span>
                <span className="text-[15.5px] text-body">
                  {motif.label} · {motif.duree}
                </span>
              </div>
            ) : (
              <span className="text-[15.5px] text-body">
                Choisissez un jour puis un horaire.
              </span>
            )}
            <div className="h-px bg-border-strong" />
            <span className="text-[15.5px] leading-relaxed text-body">
              {siteConfig.adresseLigne1}, {siteConfig.adresseLigne2}
              <br />
              {siteConfig.metro}
            </span>
            <Button
              disabled={!selection}
              onClick={() => setStep(2)}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer
            </Button>
            <span className="text-[13.5px] leading-relaxed text-muted">
              Le créneau est bloqué 15 minutes pendant votre réservation.
            </span>
          </div>
        </div>
      )}

      {step === 2 && (
        <form
          className="grid w-full gap-7 lg:grid-cols-[1fr_320px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!consent) return;
            setStep(3);
          }}
        >
          <div className="flex flex-col gap-5.5 rounded-2xl border border-border bg-white p-8">
            <h1 className="font-serif text-3xl">Vos coordonnées</h1>
            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[15px] text-body">
                Nom et prénom
                <input
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[15px] text-body">
                Téléphone
                <input
                  required
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
                />
              </label>
              <label className="col-span-full flex flex-col gap-1.5 text-[15px] text-body">
                Email — pour valider le rendez-vous
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[56px] rounded-[10px] border-2 border-accent bg-white px-4.5 text-[17px] text-ink focus:outline-none"
                />
              </label>
              <label className="col-span-full flex flex-col gap-1.5 text-[15px] text-body">
                Motif — précisez si besoin{" "}
                <span className="text-faint">(optionnel)</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex. : douleur à la mâchoire depuis 3 semaines, adressée par le Dr…"
                  className="rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 py-3.5 text-[16.5px] text-ink placeholder:text-[#9AA5A0] focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <label className="flex items-start gap-3">
              <input
                required
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-[22px] w-[22px] accent-accent"
              />
              <span className="max-w-xl text-[15px] leading-relaxed text-body">
                J&apos;accepte que mes données soient utilisées pour la
                gestion de ce rendez-vous. Elles ne sont ni revendues ni
                utilisées à des fins commerciales.
              </span>
            </label>
            <div className="flex items-center gap-3.5">
              <Button type="submit">Valider ma demande</Button>
              <span className="text-[15.5px] text-muted">
                Aucun compte à créer.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 rounded-2xl bg-sable p-7">
            <span className="eyebrow">Votre rendez-vous</span>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-[25px] leading-tight">
                {formatDateLongue(selectedDate!)}
                <br />
                {selectedTime}
              </span>
              <span className="text-[15.5px] text-body">
                {motif.label} · {motif.duree}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-left text-[15.5px] font-semibold text-accent underline"
            >
              Modifier le créneau
            </button>
            <div className="h-px bg-border-strong" />
            <span className="text-[15px] leading-relaxed text-body">
              Séance sur prescription : pensez à apporter votre ordonnance et
              votre carte Vitale.
            </span>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-sauge">
            <span className="h-6 w-8.5 rounded border-[2.5px] border-accent" />
          </div>
          <h1 className="font-serif text-[29px] leading-tight">
            Vérifiez votre email pour valider le rendez-vous
          </h1>
          <p className="text-[17px] leading-relaxed text-body">
            Nous venons d&apos;envoyer un lien à{" "}
            <strong className="text-ink">{email || "votre adresse"}</strong>.
            Cliquez dessus pour confirmer le créneau ci-dessous.
          </p>
          <div className="w-full rounded-2xl border border-border bg-white p-5 text-left">
            <span className="eyebrow">Créneau réservé 15 min</span>
            <div className="font-serif text-[22px]">
              {formatDateLongue(selectedDate!)} · {selectedTime}
            </div>
            <div className="text-[15.5px] text-body">
              {siteConfig.adresseLigne1}, {siteConfig.ville}
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setResent(true)}
          >
            {resent ? "Email renvoyé" : "Renvoyer l'email"}
          </Button>
          <span className="text-sm text-muted">
            Rien reçu ? Vérifiez vos spams ou appelez le {siteConfig.telephone}.
          </span>

          <div className="mt-2 w-full border-t border-dashed border-border-strong pt-5">
            <p className="mb-2 text-xs text-faint">
              Démo — dans la version finale, ce bouton n&apos;existe pas : le
              lien reçu par email confirme directement le rendez-vous.
            </p>
            <button
              type="button"
              onClick={goToConfirmation}
              className="text-sm font-semibold text-accent underline"
            >
              Simuler le clic sur le lien de confirmation →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
