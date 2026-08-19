"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  semaineType,
  exceptionsInitiales,
  type Exception,
} from "@/lib/mock-disponibilites";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "flex h-[30px] w-[52px] items-center rounded-full p-[3px] transition-colors " +
        (on ? "justify-end bg-accent" : "justify-start bg-border-strong")
      }
      aria-pressed={on}
    >
      <span className="h-6 w-6 rounded-full bg-white" />
    </button>
  );
}

export function AvailabilityBoard() {
  const [jours, setJours] = useState(semaineType);
  const [exceptions, setExceptions] = useState<Exception[]>(exceptionsInitiales);
  const [saved, setSaved] = useState(false);

  const [date, setDate] = useState("");
  const [type, setType] = useState<Exception["type"]>("fermeture");
  const [de, setDe] = useState("");
  const [a, setA] = useState("");

  function toggleJour(index: number) {
    setJours((js) =>
      js.map((j, i) => (i === index ? { ...j, ouvert: !j.ouvert } : j))
    );
  }

  function ajouterException(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !de || !a) return;
    setExceptions((list) => [
      {
        id: crypto.randomUUID(),
        label: `${date} — ${de} à ${a}`,
        sublabel: type === "fermeture" ? "Fermeture" : "Créneau ajouté",
        type,
      },
      ...list,
    ]);
    setDate("");
    setDe("");
    setA("");
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft px-8 py-5.5">
        <h1 className="font-serif text-[27px]">Mes disponibilités</h1>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-muted">
            Dernière modification le 12 août
          </span>
          <Button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Enregistré ✓" : "Enregistrer"}
          </Button>
        </div>
      </div>

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
            <div className="grid grid-cols-[130px_1fr_96px] bg-cream px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              <span>Jour</span>
              <span>Plages horaires</span>
              <span className="text-right">Ouvert</span>
            </div>
            {jours.map((j, i) => (
              <div
                key={j.jour}
                className={
                  "grid grid-cols-[130px_1fr_96px] items-center border-t border-border-soft px-5 py-4 " +
                  (!j.ouvert ? "bg-[#F9F8F3]" : "")
                }
              >
                <span
                  className={
                    "text-[16.5px] font-semibold " +
                    (!j.ouvert ? "text-faint" : "")
                  }
                >
                  {j.jour}
                </span>
                {j.ouvert ? (
                  <div className="flex flex-wrap gap-2">
                    {j.plages.map((p) => (
                      <span
                        key={p}
                        className="rounded-lg border-[1.5px] border-border-strong bg-linen px-3.5 py-2 text-[15px]"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="rounded-lg border-[1.5px] border-dashed border-border-input px-3 py-2 text-[15px] text-accent">
                      + plage
                    </span>
                  </div>
                ) : (
                  <span className="text-[15.5px] text-faint">Fermé</span>
                )}
                <div className="flex justify-end">
                  <Toggle on={j.ouvert} onToggle={() => toggleJour(i)} />
                </div>
              </div>
            ))}
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
                    (exc.type === "fermeture" ? "bg-danger" : "bg-accent")
                  }
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[16.5px] font-semibold">{exc.label}</span>
                  <span className="text-[15px] text-body">{exc.sublabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExceptions((l) => l.filter((x) => x.id !== exc.id))
                  }
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
            onSubmit={ajouterException}
            className="flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-dashed border-border-strong bg-cream p-5.5"
          >
            <span className="eyebrow">Nouvelle exception</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Exception["type"])}
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                >
                  <option value="fermeture">Fermeture</option>
                  <option value="ajout">Créneau ajouté</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                De
                <input
                  type="time"
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                  className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-white px-4 text-[16.5px] focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
                À
                <input
                  type="time"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
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
