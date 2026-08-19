"use client";

import { useState } from "react";
import type { Rdv } from "@/lib/mock-agenda";

export function CancelModal({
  rdv,
  onClose,
  onConfirm,
}: {
  rdv: Rdv;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [releaseSlot, setReleaseSlot] = useState(true);
  const [message, setMessage] = useState(
    `Bonjour, je dois malheureusement annuler notre séance du ${rdv.jour} à ${rdv.time}. Rappelez le cabinet pour trouver un nouveau créneau. Bien à vous.`
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#6E7873]/80 px-6">
      <div className="flex w-full max-w-[480px] flex-col gap-5 rounded-2xl bg-linen p-8 shadow-2xl">
        <h3 className="font-serif text-[27px] leading-tight">
          Annuler ce rendez-vous ?
        </h3>

        <div className="flex flex-col gap-0.5 rounded-xl bg-sable p-4.5">
          <span className="text-[17px] font-semibold">{rdv.patient}</span>
          <span className="text-[15.5px] text-body">
            {rdv.jour} · {rdv.time}
            {rdv.endTime ? ` — ${rdv.endTime}` : ""} — {rdv.motif}
          </span>
          {rdv.telephone && (
            <span className="text-[15.5px] text-body">{rdv.telephone}</span>
          )}
        </div>

        <label className="flex flex-col gap-2 text-[15px] text-body">
          Message envoyé au patient <span className="text-faint">(modifiable)</span>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 py-3.5 text-base leading-relaxed text-[#3B4A44] focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={releaseSlot}
            onChange={(e) => setReleaseSlot(e.target.checked)}
            className="h-[22px] w-[22px] accent-accent"
          />
          <span className="text-[15.5px] text-body">
            Libérer le créneau pour d&apos;autres patients
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-white py-4 text-[16.5px] font-semibold text-ink"
          >
            Revenir
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[10px] bg-danger py-4 text-[16.5px] font-semibold text-white"
          >
            Annuler le RDV
          </button>
        </div>
      </div>
    </div>
  );
}
