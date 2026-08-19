"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-7.5">
        <h3 className="font-serif text-2xl">Message envoyé</h3>
        <p className="text-[16px] leading-relaxed text-body">
          Merci, nous vous répondons sous 24 h ouvrées.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-7.5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <h3 className="font-serif text-[26px]">Écrire au cabinet</h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
          Nom et prénom
          <input
            required
            type="text"
            className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 text-base text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
          Téléphone
          <input
            required
            type="tel"
            className="h-[52px] rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 text-base text-ink focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[14.5px] text-body">
        Votre message
        <textarea
          required
          rows={4}
          className="rounded-[10px] border-[1.5px] border-border-strong bg-linen px-4 py-3 text-base text-ink focus:border-accent focus:outline-none"
        />
      </label>
      <Button type="submit">Envoyer</Button>
    </form>
  );
}
