"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Stepper } from "@/components/booking/Stepper";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { motifs, type MotifId } from "@/lib/motifs";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import {
  addUTCDays,
  formatUTCDate,
  formatUTCTime,
  isSameUTCDay,
  startOfUTCDay,
} from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

type Step = 1 | 2 | 3;
type ApiSlot = { start: string; end: string };

const AVAILABLE_SLOTS_QUERY = /* GraphQL */ `
  query AvailableSlots($from: DateTime!, $to: DateTime!) {
    availableSlots(from: $from, to: $to) {
      start
      end
    }
  }
`;

const REQUEST_APPOINTMENT_MUTATION = /* GraphQL */ `
  mutation RequestAppointment($input: RequestAppointmentInput!) {
    requestAppointment(input: $input) {
      appointment {
        id
        slotStart
        slotEnd
      }
      confirmationToken
    }
  }
`;

export function BookingWizard({ motifInitial }: { motifInitial?: MotifId }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [motifId, setMotifId] = useState<MotifId>(motifInitial ?? "atm");

  const [weekOffset, setWeekOffset] = useState(0);
  const [apiSlots, setApiSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ApiSlot | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  const motif = motifs.find((m) => m.id === motifId)!;

  const weekStart = useMemo(
    () => addUTCDays(startOfUTCDay(new Date()), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addUTCDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;

    const from = weekOffset === 0 ? new Date() : weekStart;
    const to = addUTCDays(weekStart, 7);

    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setLoadingSlots(true);
        setSlotsError(null);
      })
      .then(() =>
        gqlRequest<{ availableSlots: ApiSlot[] }>(AVAILABLE_SLOTS_QUERY, {
          from: from.toISOString(),
          to: to.toISOString(),
        })
      )
      .then((data) => {
        if (!cancelled) setApiSlots(data.availableSlots);
      })
      .catch((e) => {
        if (!cancelled) {
          setSlotsError(
            e instanceof GraphQLRequestError
              ? e.message
              : "Impossible de charger les créneaux pour le moment."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, weekOffset, weekStart]);

  const slotsByDay = useMemo(() => {
    const map = new Map<number, ApiSlot[]>();
    days.forEach((_, i) => map.set(i, []));
    for (const slot of apiSlots) {
      const start = new Date(slot.start);
      const i = days.findIndex((d) => isSameUTCDay(d, start));
      if (i !== -1) map.get(i)!.push(slot);
    }
    return map;
  }, [apiSlots, days]);

  const selection = selectedSlot
    ? `${formatUTCDate(new Date(selectedSlot.start), {
        weekday: "long",
        day: "numeric",
        month: "long",
      })} à ${formatUTCTime(new Date(selectedSlot.start))} — ${SLOT_DURATION_MINUTES} min`
    : null;

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const reason = message.trim() ? `${motif.label} — ${message.trim()}` : motif.label;
      const data = await gqlRequest<{
        requestAppointment: { confirmationToken: string };
      }>(REQUEST_APPOINTMENT_MUTATION, {
        input: {
          slotStart: selectedSlot.start,
          patientName: nom,
          patientPhone: telephone,
          patientEmail: email,
          reason,
        },
      });
      setConfirmationToken(data.requestAppointment.confirmationToken);
      setStep(3);
    } catch (err) {
      setSubmitError(
        err instanceof GraphQLRequestError
          ? err.message
          : "Impossible d'envoyer la demande. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function backToSlotSelection() {
    setSelectedSlot(null);
    setSubmitError(null);
    setStep(1);
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

            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="flex max-w-sm flex-1 flex-col gap-1.5 text-[14.5px] text-body">
                Motif de consultation
                <select
                  value={motifId}
                  onChange={(e) => setMotifId(e.target.value as MotifId)}
                  className="h-[56px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4.5 text-[17px] text-ink focus:border-accent focus:outline-none"
                >
                  {motifs.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong text-[#A7B0AB] disabled:opacity-40"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong"
                >
                  ›
                </button>
              </div>
            </div>

            {slotsError && (
              <div className="rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
                {slotsError}
              </div>
            )}

            {loadingSlots ? (
              <div className="py-10 text-center text-body">Chargement des créneaux…</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                {days.map((day, i) => {
                  const daySlots = slotsByDay.get(i) ?? [];
                  return (
                    <div key={day.toISOString()} className="flex flex-col gap-2.5">
                      <div className="rounded-[10px] bg-cream py-2.5 text-center">
                        <div className="text-[13px] text-muted">
                          {formatUTCDate(day, { weekday: "short" })}
                        </div>
                        <div className="text-lg font-semibold">{day.getUTCDate()}</div>
                      </div>
                      {daySlots.length === 0 ? (
                        <div className="rounded-[10px] border-[1.5px] border-dashed border-border-strong px-2 py-4 text-center text-[13.5px] leading-tight text-faint">
                          Aucun créneau
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const selected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={
                                "flex h-[52px] items-center justify-center rounded-[10px] text-[16.5px] font-semibold transition-colors " +
                                (selected
                                  ? "border-2 border-accent bg-sauge text-sauge-ink"
                                  : "border-[1.5px] border-border-input bg-white text-ink hover:border-accent")
                              }
                            >
                              {formatUTCTime(new Date(slot.start))}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-sable p-7">
            <span className="eyebrow">Votre sélection</span>
            {selection ? (
              <div className="flex flex-col gap-1">
                <span className="font-serif text-[22px] leading-tight">{selection}</span>
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
              Le créneau est bloqué {PENDING_HOLD_MINUTES} minutes pendant
              votre réservation.
            </span>
          </div>
        </div>
      )}

      {step === 2 && selectedSlot && (
        <form
          className="grid w-full gap-7 lg:grid-cols-[1fr_320px]"
          onSubmit={submitRequest}
        >
          <div className="flex flex-col gap-5.5 rounded-2xl border border-border bg-white p-8">
            <h1 className="font-serif text-3xl">Vos coordonnées</h1>

            {submitError && (
              <div className="rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
                {submitError}
              </div>
            )}

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
              <Button type="submit" disabled={submitting}>
                {submitting ? "Envoi…" : "Valider ma demande"}
              </Button>
              <span className="text-[15.5px] text-muted">
                Aucun compte à créer.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 rounded-2xl bg-sable p-7">
            <span className="eyebrow">Votre rendez-vous</span>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-[22px] leading-tight">
                {formatUTCDate(new Date(selectedSlot.start), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                <br />
                {formatUTCTime(new Date(selectedSlot.start))}
              </span>
              <span className="text-[15.5px] text-body">
                {motif.label} · {SLOT_DURATION_MINUTES} min
              </span>
            </div>
            <button
              type="button"
              onClick={backToSlotSelection}
              className="text-left text-[15.5px] font-semibold text-accent underline"
            >
              Modifier le créneau
            </button>
          </div>
        </form>
      )}

      {step === 3 && selectedSlot && (
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
            <span className="eyebrow">Créneau réservé {SLOT_DURATION_MINUTES} min</span>
            <div className="font-serif text-[22px]">
              {formatUTCDate(new Date(selectedSlot.start), {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {formatUTCTime(new Date(selectedSlot.start))}
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
              Démo — l&apos;envoi d&apos;email (Brevo) n&apos;est pas encore
              branché. Dans la version finale, ce bouton n&apos;existe pas :
              le lien reçu par email confirme directement le rendez-vous.
            </p>
            <button
              type="button"
              onClick={() =>
                confirmationToken &&
                router.push(`/rendez-vous/confirmation?token=${confirmationToken}`)
              }
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
