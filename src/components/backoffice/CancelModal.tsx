"use client";

import { useState } from "react";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";

export type CancellableAppointment = {
  id: string;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientPhone: string;
  reason: string | null;
};

export function CancelModal({
  appointment,
  onClose,
  onConfirm,
}: {
  appointment: CancellableAppointment;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = new Date(appointment.slotStart);
  const end = new Date(appointment.slotEnd);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError("Impossible d'annuler ce rendez-vous. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#6E7873]/80 px-6">
      <div className="flex w-full max-w-[480px] flex-col gap-5 rounded-2xl bg-linen p-8 shadow-2xl">
        <h3 className="font-serif text-[27px] leading-tight">
          Annuler ce rendez-vous ?
        </h3>

        <div className="flex flex-col gap-0.5 rounded-xl bg-sable p-4.5">
          <span className="text-[17px] font-semibold">{appointment.patientName}</span>
          <span className="text-[15.5px] text-body">
            {formatUTCDate(start, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {formatUTCTime(start)} — {formatUTCTime(end)}
            {appointment.reason ? ` — ${appointment.reason}` : ""}
          </span>
          <span className="text-[15.5px] text-body">{appointment.patientPhone}</span>
        </div>

        <p className="text-[15px] leading-relaxed text-body">
          Le créneau sera immédiatement libéré et redeviendra disponible à la
          réservation.
        </p>

        {error && (
          <div className="rounded-xl bg-terracotta-soft px-4 py-3 text-[14.5px] text-terracotta-ink">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-white py-4 text-[16.5px] font-semibold text-ink disabled:opacity-50"
          >
            Revenir
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-[10px] bg-danger py-4 text-[16.5px] font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Annulation…" : "Annuler le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}
