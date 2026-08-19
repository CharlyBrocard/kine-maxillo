"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { SLOT_DURATION_MINUTES } from "@/lib/booking-constants";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

const CONFIRM_APPOINTMENT_MUTATION = /* GraphQL */ `
  mutation ConfirmAppointment($token: String!) {
    confirmAppointment(token: $token) {
      appointment {
        slotStart
        reason
      }
      cancellationToken
    }
  }
`;

type Result = {
  slotStart: string;
  reason: string | null;
  cancellationToken: string;
};

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (!token) {
          throw new GraphQLRequestError("Lien de confirmation manquant.");
        }
        return gqlRequest<{
          confirmAppointment: {
            appointment: { slotStart: string; reason: string | null };
            cancellationToken: string;
          };
        }>(CONFIRM_APPOINTMENT_MUTATION, { token });
      })
      .then((data) => {
        if (cancelled) return;
        setResult({
          slotStart: data.confirmAppointment.appointment.slotStart,
          reason: data.confirmAppointment.appointment.reason,
          cancellationToken: data.confirmAppointment.cancellationToken,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof GraphQLRequestError
            ? e.message
            : "Impossible de confirmer ce rendez-vous."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-white p-9 text-center">
        <p className="text-body">Confirmation du rendez-vous…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
        <h1 className="font-serif text-2xl">Lien invalide</h1>
        <p className="text-[16px] leading-relaxed text-body">
          {error ?? "Ce lien de confirmation n'est plus valide."}
        </p>
        <ButtonLink href="/rendez-vous" className="w-full">
          Reprendre un rendez-vous
        </ButtonLink>
      </div>
    );
  }

  const slotStart = new Date(result.slotStart);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-accent text-[34px] text-white">
        ✓
      </div>
      <h1 className="font-serif text-[30px] leading-tight">
        Votre rendez-vous est confirmé
      </h1>

      <div className="w-full rounded-2xl bg-sauge p-6 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
            Quand
          </span>
          <span className="font-serif text-2xl">
            {formatUTCDate(slotStart, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {formatUTCTime(slotStart)}
          </span>
          <span className="text-[15px] text-[#3B4A44]">
            Durée {SLOT_DURATION_MINUTES} min — arrivez 5 min avant
          </span>
        </div>
        <div className="my-3.5 h-px bg-accent/20" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
            Où
          </span>
          <span className="text-[17px] leading-relaxed text-ink">
            Cabinet {siteConfig.praticienne}
            <br />
            {siteConfig.adresseLigne1}, {siteConfig.adresseLigne2}
          </span>
        </div>
        {result.reason && (
          <>
            <div className="my-3.5 h-px bg-accent/20" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E8A80]">
                Motif
              </span>
              <span className="text-[17px] text-ink">{result.reason}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex w-full flex-col gap-2 border-t border-border-soft pt-4.5">
        <span className="text-[15px] leading-relaxed text-body">
          Un empêchement ? Merci de prévenir au moins 24 h avant.
        </span>
        <Link
          href={`/rendez-vous/annule?token=${result.cancellationToken}`}
          className="text-[16.5px] font-semibold text-danger underline"
        >
          Annuler ce rendez-vous
        </Link>
      </div>
    </div>
  );
}
