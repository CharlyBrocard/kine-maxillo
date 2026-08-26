"use client";

import { useCallback, useEffect, useState } from "react";
import type { DayOfWeek, ExceptionType } from "@prisma/client";
import {
  formatUTCDate,
  minutesFromTimeInput,
  timeInputFromMinutes,
} from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

type ApiRule = { id: string; dayOfWeek: DayOfWeek; startTime: number; endTime: number };
type ApiException = {
  id: string;
  date: string;
  type: ExceptionType;
  reason: string | null;
  startTime: number | null;
  endTime: number | null;
};

const JOURS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Lundi" },
  { key: "TUESDAY", label: "Mardi" },
  { key: "WEDNESDAY", label: "Mercredi" },
  { key: "THURSDAY", label: "Jeudi" },
  { key: "FRIDAY", label: "Vendredi" },
  { key: "SATURDAY", label: "Samedi" },
  { key: "SUNDAY", label: "Dimanche" },
];

const DATA_QUERY = /* GraphQL */ `
  query DisponibilitesData {
    availabilityRules {
      id
      dayOfWeek
      startTime
      endTime
    }
    availabilityExceptions {
      id
      date
      type
      reason
      startTime
      endTime
    }
  }
`;

const SET_RULE_MUTATION = /* GraphQL */ `
  mutation SetAvailabilityRule($input: AvailabilityRuleInput!) {
    setAvailabilityRule(input: $input) {
      id
    }
  }
`;

const DELETE_RULE_MUTATION = /* GraphQL */ `
  mutation DeleteAvailabilityRule($id: ID!) {
    deleteAvailabilityRule(id: $id)
  }
`;

const ADD_EXCEPTION_MUTATION = /* GraphQL */ `
  mutation AddAvailabilityException($input: AvailabilityExceptionInput!) {
    addAvailabilityException(input: $input) {
      id
    }
  }
`;

const DELETE_EXCEPTION_MUTATION = /* GraphQL */ `
  mutation DeleteAvailabilityException($id: ID!) {
    deleteAvailabilityException(id: $id)
  }
`;

function formatExceptionLabel(exc: ApiException): string {
  const date = formatUTCDate(new Date(exc.date), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (exc.startTime == null || exc.endTime == null) {
    return `${date} — toute la journée`;
  }
  return `${date} — ${timeInputFromMinutes(exc.startTime)} à ${timeInputFromMinutes(exc.endTime)}`;
}

export function AvailabilityBoard() {
  const [rules, setRules] = useState<ApiRule[]>([]);
  const [exceptions, setExceptions] = useState<ApiException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addingFor, setAddingFor] = useState<DayOfWeek | null>(null);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [plageError, setPlageError] = useState<string | null>(null);

  const [excDate, setExcDate] = useState("");
  const [excType, setExcType] = useState<"fermeture" | "ajout">("fermeture");
  const [excAllDay, setExcAllDay] = useState(true);
  const [excStart, setExcStart] = useState("08:30");
  const [excEnd, setExcEnd] = useState("19:00");
  const [excReason, setExcReason] = useState("");
  const [excFormError, setExcFormError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    return gqlRequest<{ availabilityRules: ApiRule[]; availabilityExceptions: ApiException[] }>(
      DATA_QUERY
    ).then((data) => {
      setRules(data.availabilityRules);
      setExceptions(data.availabilityExceptions);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setLoading(true);
        setError(null);
      })
      .then(() => refetch())
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof GraphQLRequestError
            ? e.message
            : "Impossible de charger les disponibilités."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  async function submitPlage(day: DayOfWeek) {
    setPlageError(null);
    const startTime = minutesFromTimeInput(newStart);
    const endTime = minutesFromTimeInput(newEnd);
    if (startTime >= endTime) {
      setPlageError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    try {
      await gqlRequest(SET_RULE_MUTATION, {
        input: { dayOfWeek: day, startTime, endTime },
      });
      setAddingFor(null);
      await refetch();
    } catch (e) {
      setPlageError(
        e instanceof GraphQLRequestError ? e.message : "Impossible d'ajouter cette plage."
      );
    }
  }

  async function removePlage(id: string) {
    try {
      await gqlRequest(DELETE_RULE_MUTATION, { id });
      await refetch();
    } catch {
      setError("Impossible de supprimer cette plage.");
    }
  }

  async function removeException(id: string) {
    try {
      await gqlRequest(DELETE_EXCEPTION_MUTATION, { id });
      await refetch();
    } catch {
      setError("Impossible de supprimer cette exception.");
    }
  }

  async function submitException(e: React.FormEvent) {
    e.preventDefault();
    setExcFormError(null);
    if (!excDate) {
      setExcFormError("La date est obligatoire.");
      return;
    }
    const startTime = excAllDay ? undefined : minutesFromTimeInput(excStart);
    const endTime = excAllDay ? undefined : minutesFromTimeInput(excEnd);
    if (!excAllDay && startTime! >= endTime!) {
      setExcFormError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    try {
      await gqlRequest(ADD_EXCEPTION_MUTATION, {
        input: {
          date: `${excDate}T00:00:00.000Z`,
          type: excType === "fermeture" ? "CLOSED" : "ADDED",
          reason: excReason.trim() || undefined,
          startTime,
          endTime,
        },
      });
      setExcDate("");
      setExcReason("");
      setExcAllDay(true);
      await refetch();
    } catch (e) {
      setExcFormError(
        e instanceof GraphQLRequestError
          ? e.message
          : "Impossible d'ajouter cette exception."
      );
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft px-8 py-5.5">
        <h1 className="font-serif text-[27px]">Mes disponibilités</h1>
        {loading && <span className="text-[15px] text-muted">Chargement…</span>}
      </div>

      {error && (
        <div className="mx-8 mt-6 rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
          {error}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-8 p-6 lg:grid-cols-[1.35fr_1fr] lg:p-8">
        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-[23px]">Semaine type récurrente</h2>
            <p className="text-base leading-relaxed text-body">
              Ces plages génèrent automatiquement les créneaux proposés aux
              patients, par pas de 40 minutes.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[130px_1fr] bg-cream px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              <span>Jour</span>
              <span>Plages horaires</span>
            </div>
            {JOURS.map((jour) => {
              const dayRules = rules
                .filter((r) => r.dayOfWeek === jour.key)
                .sort((a, b) => a.startTime - b.startTime);
              const isAdding = addingFor === jour.key;

              return (
                <div
                  key={jour.key}
                  className={
                    "grid grid-cols-[130px_1fr] items-start border-t border-border-soft px-5 py-4 " +
                    (dayRules.length === 0 && !isAdding ? "bg-[#F9F8F3]" : "")
                  }
                >
                  <span
                    className={
                      "pt-3 text-[16.5px] font-semibold " +
                      (dayRules.length === 0 ? "text-faint" : "")
                    }
                  >
                    {jour.label}
                  </span>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {dayRules.map((r) => (
                        <span
                          key={r.id}
                          className="flex items-center gap-2 rounded-lg border-[1.5px] border-border-strong bg-linen px-3.5 py-2 text-[15px]"
                        >
                          {timeInputFromMinutes(r.startTime)} – {timeInputFromMinutes(r.endTime)}
                          <button
                            type="button"
                            onClick={() => removePlage(r.id)}
                            className="text-faint hover:text-danger"
                            aria-label="Supprimer cette plage"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {dayRules.length === 0 && !isAdding && (
                        <span className="text-[15.5px] text-faint">Fermé</span>
                      )}
                      {!isAdding && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFor(jour.key);
                            setPlageError(null);
                          }}
                          className="rounded-lg border-[1.5px] border-dashed border-border-input px-3 py-2 text-[15px] text-accent"
                        >
                          + plage
                        </button>
                      )}
                    </div>
                    {isAdding && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          type="time"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="h-10 rounded-lg border-[1.5px] border-border-strong px-2.5 text-[15px]"
                        />
                        <span className="text-body">à</span>
                        <input
                          type="time"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="h-10 rounded-lg border-[1.5px] border-border-strong px-2.5 text-[15px]"
                        />
                        <button
                          type="button"
                          onClick={() => submitPlage(jour.key)}
                          className="rounded-lg bg-accent px-3.5 py-2 text-[14.5px] font-semibold text-white"
                        >
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFor(null);
                            setPlageError(null);
                          }}
                          className="text-[14.5px] text-muted underline"
                        >
                          Annuler
                        </button>
                        {plageError && (
                          <span className="w-full text-[13.5px] text-danger">{plageError}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl bg-sauge px-6 py-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-sauge-ink">Durée d&apos;une séance</span>
              <span className="text-[17px] font-semibold">40 minutes</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-sauge-ink">Pressothérapie</span>
              <span className="text-[17px] font-semibold">30 minutes</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-sauge-ink">Délai mini de réservation</span>
              <span className="text-[17px] font-semibold">12 heures</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-[23px]">Exceptions ponctuelles</h2>
            <p className="text-base leading-relaxed text-body">
              Une fermeture exceptionnelle ou un créneau ouvert en plus, sans
              toucher à la semaine type.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-border">
            {exceptions.map((exc) => (
              <div
                key={exc.id}
                className="flex items-center gap-3.5 border-b border-border-soft p-4 last:border-b-0"
              >
                <span
                  className={
                    "h-10 w-2 shrink-0 rounded-full " +
                    (exc.type === "CLOSED" ? "bg-danger" : "bg-accent")
                  }
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[16.5px] font-semibold">
                    {formatExceptionLabel(exc)}
                  </span>
                  <span className="text-[15px] text-body">
                    {exc.type === "CLOSED" ? "Fermeture" : "Créneau ajouté"}
                    {exc.reason ? ` · ${exc.reason}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeException(exc.id)}
                  className="text-[15px] text-muted underline"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {exceptions.length === 0 && (
              <div className="p-6 text-center text-[15px] text-faint">
                Aucune exception
              </div>
            )}
          </div>

          <form
            onSubmit={submitException}
            className="flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-dashed border-border-strong bg-cream p-5.5"
          >
            <span className="eyebrow">Nouvelle exception</span>
            {excFormError && (
              <div className="rounded-lg bg-terracotta-soft px-4 py-3 text-[14.5px] text-terracotta-ink">
                {excFormError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                Date
                <input
                  type="date"
                  value={excDate}
                  onChange={(e) => setExcDate(e.target.value)}
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                Type
                <select
                  value={excType}
                  onChange={(e) => setExcType(e.target.value as "fermeture" | "ajout")}
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                >
                  <option value="fermeture">Fermeture</option>
                  <option value="ajout">Créneau ajouté</option>
                </select>
              </label>
              <label className="col-span-2 flex items-center gap-2.5 text-[14.5px] text-body">
                <input
                  type="checkbox"
                  checked={excAllDay}
                  onChange={(e) => setExcAllDay(e.target.checked)}
                  className="h-[20px] w-[20px] accent-accent"
                />
                Toute la journée
              </label>
              {!excAllDay && (
                <>
                  <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                    De
                    <input
                      type="time"
                      value={excStart}
                      onChange={(e) => setExcStart(e.target.value)}
                      className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                    À
                    <input
                      type="time"
                      value={excEnd}
                      onChange={(e) => setExcEnd(e.target.value)}
                      className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                    />
                  </label>
                </>
              )}
              <label className="col-span-2 flex flex-col gap-1.5 text-[14.5px] text-body">
                Motif <span className="text-faint">(optionnel)</span>
                <input
                  type="text"
                  value={excReason}
                  onChange={(e) => setExcReason(e.target.value)}
                  placeholder="Ex. : formation ATM"
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-[10px] bg-ink py-3.5 text-[16px] font-semibold text-white"
            >
              Ajouter l&apos;exception
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
