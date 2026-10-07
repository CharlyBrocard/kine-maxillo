"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site-config";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

const CANCEL_APPOINTMENT_MUTATION = /* GraphQL */ `
  mutation CancelAppointment($token: String!) {
    cancelAppointment(token: $token) {
      appointment {
        status
      }
    }
  }
`;

export function AnnuleClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (!token) {
          throw new GraphQLRequestError("Lien d'annulation manquant.");
        }
        return gqlRequest(CANCEL_APPOINTMENT_MUTATION, { token });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof GraphQLRequestError
            ? e.message
            : "Impossible d'annuler ce rendez-vous."
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
        <p className="text-body">Annulation en cours…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
        <h1 className="font-serif text-2xl">Lien invalide</h1>
        <p className="text-[16px] leading-relaxed text-body">{error}</p>
        <ButtonLink href="/rendez-vous" className="w-full">
          Reprendre un rendez-vous
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border bg-white p-9 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-terracotta-soft">
        <span className="h-[2.5px] w-6.5 bg-danger" />
      </div>
      <h1 className="font-serif text-[29px] leading-tight">
        Votre rendez-vous a bien été annulé
      </h1>
      <p className="text-[17px] leading-relaxed text-body">
        Le créneau est libéré et redevient disponible à la réservation.
      </p>
      <div className="flex w-full flex-col gap-2.5 pt-1">
        <ButtonLink href="/rendez-vous" className="w-full">
          Reprendre un rendez-vous
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" className="w-full">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
      <span className="pt-1.5 text-[14.5px] leading-relaxed text-muted">
        Besoin d&apos;un créneau rapidement ? Appelez le{" "}
        {siteConfig.telephone}, un désistement est parfois possible.
      </span>
    </div>
  );
}
