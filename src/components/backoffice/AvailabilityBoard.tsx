"use client";

import { useCallback, useEffect, useState } from "react";
import { categories, categoryLabel, type CategoryId } from "@/lib/categories";
import { formatUTCDate, formatUTCTime, dateFromInputs } from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

type ApiSlot = {
  id: string;
  start: string;
  category: CategoryId;
  booked: boolean;
};

const SLOTS_QUERY = /* GraphQL */ `
  query AvailableSlotEntries($from: DateTime!, $to: DateTime!) {
    availableSlotEntries(from: $from, to: $to) {
      id
      start
      category
      booked
    }
  }
`;

const ADD_SLOT_MUTATION = /* GraphQL */ `
  mutation AddAvailableSlot($input: AddAvailableSlotInput!) {
    addAvailableSlot(input: $input) {
      id
    }
  }
`;

const DELETE_SLOT_MUTATION = /* GraphQL */ `
  mutation DeleteAvailableSlot($id: ID!) {
    deleteAvailableSlot(id: $id)
  }
`;

// Fenêtre large : pas de pagination pour l'instant, la liste reste courte
// tant que les créneaux sont ajoutés un par un.
const WINDOW_DAYS = 90;

export function AvailabilityBoard() {
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<CategoryId>(categories[0].id);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = useCallback(() => {
    const from = new Date();
    const to = new Date(from.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return gqlRequest<{ availableSlotEntries: ApiSlot[] }>(SLOTS_QUERY, {
      from: from.toISOString(),
      to: to.toISOString(),
    }).then((data) => setSlots(data.availableSlotEntries));
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
            : "Impossible de charger les créneaux."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  async function submitSlot(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!date) {
      setFormError("La date est obligatoire.");
      return;
    }
    const start = dateFromInputs(date, time);
    if (start.getTime() < Date.now()) {
      setFormError("Le créneau doit être dans le futur.");
      return;
    }
    setSubmitting(true);
    try {
      await gqlRequest(ADD_SLOT_MUTATION, {
        input: { start: start.toISOString(), category },
      });
      setDate("");
      await refetch();
    } catch (e) {
      setFormError(
        e instanceof GraphQLRequestError
          ? e.message
          : "Impossible d'ajouter ce créneau."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSlot(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await gqlRequest(DELETE_SLOT_MUTATION, { id });
      await refetch();
    } catch (e) {
      setError(
        e instanceof GraphQLRequestError
          ? e.message
          : "Impossible de supprimer ce créneau."
      );
    } finally {
      setDeletingId(null);
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

      <div className="grid flex-1 grid-cols-1 gap-8 p-6 lg:grid-cols-[420px_1fr] lg:p-8">
        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-[23px]">Ouvrir un créneau</h2>
            <p className="text-base leading-relaxed text-body">
              Pas de récurrence : chaque créneau est ajouté au coup par coup,
              par catégorie.
            </p>
          </div>

          <form
            onSubmit={submitSlot}
            className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-6"
          >
            {formError && (
              <div className="rounded-lg bg-terracotta-soft px-4 py-3 text-[14.5px] text-terracotta-ink">
                {formError}
              </div>
            )}
            <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 text-[16.5px] focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
              Heure
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 text-[16.5px] focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
              Catégorie
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 text-[16.5px] focus:border-accent focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[10px] bg-accent py-3.5 text-[16px] font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Ajout…" : "Ajouter le créneau"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4.5">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-[23px]">Créneaux ouverts</h2>
            <p className="text-base leading-relaxed text-body">
              Les créneaux réservés sont marqués comme tels — annulez le RDV
              depuis l&apos;agenda pour les libérer.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-border">
            {slots.map((slot) => {
              const start = new Date(slot.start);
              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-3.5 border-b border-border-soft p-4 last:border-b-0"
                >
                  <span
                    className={
                      "h-10 w-2 shrink-0 rounded-full " +
                      (slot.booked ? "bg-border-strong" : "bg-accent")
                    }
                  />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[16.5px] font-semibold">
                      {formatUTCDate(start, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {formatUTCTime(start)}
                    </span>
                    <span className="text-[15px] text-body">
                      {categoryLabel(slot.category)}
                    </span>
                  </div>
                  {slot.booked ? (
                    <span className="rounded-full bg-sable px-3.5 py-1.5 text-[13.5px] font-semibold text-muted">
                      Réservé
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      disabled={deletingId === slot.id}
                      className="text-[15px] text-muted underline disabled:opacity-50"
                    >
                      {deletingId === slot.id ? "Suppression…" : "Supprimer"}
                    </button>
                  )}
                </div>
              );
            })}
            {slots.length === 0 && !loading && (
              <div className="p-6 text-center text-[15px] text-faint">
                Aucun créneau ouvert pour l&apos;instant
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
