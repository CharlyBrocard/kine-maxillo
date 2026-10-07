"use client";

import { useEffect, useMemo, useState } from "react";
import { Stepper } from "@/components/booking/Stepper";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { categories, categoryLabel, type CategoryId } from "@/lib/categories";
import { PENDING_HOLD_MINUTES, SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import {
  addUTCDays,
  formatUTCDate,
  formatUTCTime,
  isSameUTCDay,
  startOfUTCDay,
} from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";
import {
  PATIENT_EMAIL_MAX,
  PATIENT_NAME_MAX,
  PATIENT_PHONE_MAX,
  REASON_MAX,
} from "@/lib/input-limits";

// Le motif envoyé est "<catégorie> — <message>" : on garde de la marge
// pour le préfixe sous la limite REASON_MAX de l'API.
const MESSAGE_MAX = REASON_MAX - 100;

type Step = 1 | 2 | 3;
type ApiSlot = { start: string; end: string };

const AVAILABLE_SLOTS_QUERY = /* GraphQL */ `
  query AvailableSlots($category: Category!, $from: DateTime!, $to: DateTime!) {
    availableSlots(category: $category, from: $from, to: $to) {
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
    }
  }
`;

const RESEND_CONFIRMATION_MUTATION = /* GraphQL */ `
  mutation ResendConfirmationEmail($appointmentId: ID!) {
    resendConfirmationEmail(appointmentId: $appointmentId)
  }
`;

export function BookingWizard({ categoryInitial }: { categoryInitial?: CategoryId }) {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<CategoryId | null>(categoryInitial ?? null);

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
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const weekStart = useMemo(
    () => addUTCDays(startOfUTCDay(new Date()), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addUTCDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    if (step !== 1 || !category) return;
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
          category,
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
  }, [step, category, weekOffset, weekStart]);

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
    if (!consent || !selectedSlot || !category) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const label = categoryLabel(category);
      const reason = message.trim() ? `${label} — ${message.trim()}` : label;
      const data = await gqlRequest<{
        requestAppointment: { appointment: { id: string } };
      }>(REQUEST_APPOINTMENT_MUTATION, {
        input: {
          slotStart: selectedSlot.start,
          category,
          patientName: nom,
          patientPhone: telephone,
          patientEmail: email,
          reason,
        },
      });
      setAppointmentId(data.requestAppointment.appointment.id);
      setResendState("idle");
      setResendError(null);
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

  async function resendConfirmation() {
    if (!appointmentId) return;
    setResendState("sending");
    setResendError(null);
    try {
      await gqlRequest(RESEND_CONFIRMATION_MUTATION, { appointmentId });
      setResendState("sent");
    } catch (err) {
      setResendState("idle");
      setResendError(
        err instanceof GraphQLRequestError ? err.message : "Impossible de renvoyer l'email. Réessayez."
      );
    }
  }

  function backToSlotSelection() {
    setSelectedSlot(null);
    setSubmitError(null);
    setStep(1);
  }

  function changeCategory() {
    setCategory(null);
    setSelectedSlot(null);
    setApiSlots([]);
    setWeekOffset(0);
  }

  return (
    <div className="flex w-full max-w-[1000px] flex-col items-center gap-8">
      <Stepper current={step} />

      {step === 1 && !category && (
        <div className="flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="font-serif text-3xl">Quel type de rendez-vous ?</h1>
            <p className="text-base text-body">
              Les créneaux disponibles dépendent de la catégorie choisie.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-border bg-white p-7 text-left hover:border-accent"
              >
                <span className="font-serif text-2xl">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && category && (
        <div className="grid w-full gap-7 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-8">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-serif text-3xl">Choisissez un créneau</h1>
              <p className="text-base text-body">
                Les horaires affichés sont réellement disponibles.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Catégorie</span>
                <div className="flex items-center gap-3">
                  <span className="text-[17px] font-semibold">
                    {categoryLabel(category)}
                  </span>
                  <button
                    type="button"
                    onClick={changeCategory}
                    className="text-[14.5px] font-semibold text-accent underline"
                  >
                    Changer
                  </button>
                </div>
              </div>
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
              {siteConfig.zone}
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

      {step === 2 && selectedSlot && category && (
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
                  maxLength={PATIENT_NAME_MAX}
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
                  maxLength={PATIENT_PHONE_MAX}
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
                  maxLength={PATIENT_EMAIL_MAX}
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
                  maxLength={MESSAGE_MAX}
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
                {categoryLabel(category)} · {SLOT_DURATION_MINUTES} min
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
          {resendError && (
            <div className="w-full rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
              {resendError}
            </div>
          )}
          <Button
            variant="secondary"
            className="w-full"
            disabled={resendState !== "idle"}
            onClick={resendConfirmation}
          >
            {resendState === "sent"
              ? "Email renvoyé"
              : resendState === "sending"
                ? "Envoi…"
                : "Renvoyer l'email"}
          </Button>
          <span className="text-sm text-muted">
            Rien reçu ? Vérifiez vos spams ou appelez le {siteConfig.telephone}.
          </span>
        </div>
      )}
    </div>
  );
}
