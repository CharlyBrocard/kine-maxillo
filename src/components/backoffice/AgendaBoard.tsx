"use client";

import { useState } from "react";
import { CancelModal } from "@/components/backoffice/CancelModal";
import { jours, rdvSemaine, type Rdv } from "@/lib/mock-agenda";

const statusStyles: Record<Rdv["status"], string> = {
  confirme: "bg-sauge border-l-4 border-accent",
  attente: "bg-[#FAF0DC] border-l-4 border-[#E5C89A]",
  presso: "bg-terracotta-soft border-l-4 border-terracotta",
  vous: "bg-ink text-white shadow-lg",
};

export function AgendaBoard() {
  const [cancelled, setCancelled] = useState<string[]>([]);
  const [modalRdv, setModalRdv] = useState<Rdv | null>(null);

  return (
    <>
      <div className="flex flex-col gap-1 border-b border-border-soft px-8 py-5.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4.5">
            <h1 className="font-serif text-[27px]">Semaine du 24 août 2026</h1>
            <div className="flex gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong">
                ‹
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong">
                ›
              </span>
            </div>
            <span className="text-[15.5px] font-semibold text-accent">
              Aujourd&apos;hui
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-border-strong text-[15px]">
              <span className="bg-ink px-4.5 py-2.5 font-semibold text-white">
                Semaine
              </span>
              <span className="px-4.5 py-2.5 text-faint">Jour</span>
              <span className="px-4.5 py-2.5 text-faint">Liste</span>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-sm text-body">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px] bg-accent" />
                Confirmé
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px] bg-[#E5C89A]" />
                En attente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px] bg-terracotta" />
                Presso
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-x-auto p-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3 lg:p-8">
        {jours.map((jour) => {
          const rdvs = rdvSemaine
            .filter((r) => r.jour === jour.key && !cancelled.includes(r.id))
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={jour.key} className="flex flex-col gap-2.5">
              <div
                className={
                  "rounded-[10px] py-2.5 text-center " +
                  (jour.key === "mardi" ? "bg-cream" : "")
                }
              >
                <div
                  className={
                    "text-[13px] " +
                    (jour.key === "mardi" ? "text-accent" : "text-muted")
                  }
                >
                  {jour.label}
                </div>
                <div className="text-lg font-semibold">{jour.numero}</div>
              </div>

              {"ferme" in jour && jour.ferme ? (
                <div className="flex flex-1 items-center justify-center rounded-[10px] border border-dashed border-border-strong bg-cream p-6 text-center text-[13px] leading-relaxed text-faint">
                  {jour.ferme}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {rdvs.map((rdv) => (
                    <div
                      key={rdv.id}
                      className={`flex flex-col gap-0.5 rounded-lg p-3 ${statusStyles[rdv.status]}`}
                    >
                      <span
                        className={`font-mono text-[13px] ${rdv.status === "vous" ? "text-[#A7C3B9]" : "text-muted"}`}
                      >
                        {rdv.time}
                        {rdv.endTime ? ` — ${rdv.endTime}` : ""}
                      </span>
                      <span className="text-[15px] font-semibold">
                        {rdv.patient}
                      </span>
                      <span
                        className={`text-[13.5px] ${rdv.status === "vous" ? "text-[#C3D2CC]" : "text-body"}`}
                      >
                        {rdv.motif}
                        {rdv.telephone ? ` · ${rdv.telephone}` : ""}
                      </span>
                      {rdv.status === "vous" && (
                        <button
                          type="button"
                          onClick={() => setModalRdv(rdv)}
                          className="pt-1 text-left text-[13.5px] font-semibold text-[#E6A78F]"
                        >
                          Annuler ce rendez-vous
                        </button>
                      )}
                    </div>
                  ))}
                  {rdvs.length === 0 && (
                    <div className="rounded-[10px] border border-dashed border-border-soft p-6 text-center text-[13px] text-faint">
                      Aucun RDV
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalRdv && (
        <CancelModal
          rdv={modalRdv}
          onClose={() => setModalRdv(null)}
          onConfirm={() => {
            setCancelled((c) => [...c, modalRdv.id]);
            setModalRdv(null);
          }}
        />
      )}
    </>
  );
}
