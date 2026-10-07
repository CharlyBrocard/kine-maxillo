"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CancelModal, type CancellableAppointment } from "@/components/backoffice/CancelModal";
import {
  addUTCDays,
  formatUTCDate,
  formatUTCTime,
  isSameUTCDay,
  mondayOfUTCWeek,
} from "@/lib/date-utils";
import { gqlRequest, GraphQLRequestError } from "@/lib/graphql-client";

type ApiAppointment = {
  id: string;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientPhone: string;
  reason: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
};

const AGENDA_QUERY = /* GraphQL */ `
  query AgendaData($from: DateTime!, $to: DateTime!) {
    appointments(from: $from, to: $to) {
      id
      slotStart
      slotEnd
      patientName
      patientPhone
      reason
      status
    }
  }
`;

const CANCEL_AS_ADMIN_MUTATION = /* GraphQL */ `
  mutation CancelAppointmentAsAdmin($id: ID!) {
    cancelAppointmentAsAdmin(id: $id) {
      id
    }
  }
`;

const statusStyles: Record<"PENDING" | "CONFIRMED", string> = {
  CONFIRMED: "bg-sauge border-l-4 border-accent",
  PENDING: "bg-[#FAF0DC] border-l-4 border-[#E5C89A]",
};

export function AgendaBoard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAppointment, setModalAppointment] = useState<CancellableAppointment | null>(null);

  const weekStart = useMemo(
    () => addUTCDays(mondayOfUTCWeek(new Date()), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addUTCDays(weekStart, i)),
    [weekStart]
  );
  const today = useMemo(() => new Date(), []);

  const refetch = useCallback(() => {
    const to = addUTCDays(weekStart, 7);
    return gqlRequest<{ appointments: ApiAppointment[] }>(AGENDA_QUERY, {
      from: weekStart.toISOString(),
      to: to.toISOString(),
    }).then((data) => setAppointments(data.appointments));
  }, [weekStart]);

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
            : "Impossible de charger l'agenda."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  const visible = appointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  );

  return (
    <>
      <div className="flex flex-col gap-1 border-b border-border-soft px-8 py-5.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4.5">
            <h1 className="font-serif text-[27px]">
              Semaine du {formatUTCDate(weekStart, { day: "numeric", month: "long", year: "numeric" })}
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border-strong"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-[15.5px] font-semibold text-accent"
            >
              Aujourd&apos;hui
            </button>
            {loading && <span className="text-[15px] text-muted">Chargement…</span>}
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
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 rounded-xl bg-terracotta-soft px-5 py-4 text-[15px] text-terracotta-ink">
          {error}
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 gap-4 overflow-x-auto p-6 sm:grid-cols-3 lg:grid-cols-7 lg:gap-3 lg:p-8">
        {days.map((day) => {
          const dayAppointments = visible
            .filter((a) => isSameUTCDay(new Date(a.slotStart), day))
            .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
          const isToday = isSameUTCDay(day, today);

          return (
            <div key={day.toISOString()} className="flex flex-col gap-2.5">
              <div className={"rounded-[10px] py-2.5 text-center " + (isToday ? "bg-cream" : "")}>
                <div className={"text-[13px] " + (isToday ? "text-accent" : "text-muted")}>
                  {formatUTCDate(day, { weekday: "short" })}
                </div>
                <div className="text-lg font-semibold">{day.getUTCDate()}</div>
              </div>

              <div className="flex flex-col gap-2">
                {dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className={`flex flex-col gap-0.5 rounded-lg p-3 ${statusStyles[appt.status as "PENDING" | "CONFIRMED"]}`}
                  >
                    <span className="font-mono text-[13px] text-muted">
                      {formatUTCTime(new Date(appt.slotStart))} — {formatUTCTime(new Date(appt.slotEnd))}
                    </span>
                    <span className="text-[15px] font-semibold">{appt.patientName}</span>
                    <span className="text-[13.5px] text-body">
                      {appt.reason ?? "Motif non précisé"} · {appt.patientPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalAppointment({
                          id: appt.id,
                          slotStart: appt.slotStart,
                          slotEnd: appt.slotEnd,
                          patientName: appt.patientName,
                          patientPhone: appt.patientPhone,
                          reason: appt.reason,
                        })
                      }
                      className="pt-1 text-left text-[13.5px] font-semibold text-danger"
                    >
                      Annuler ce rendez-vous
                    </button>
                  </div>
                ))}
                {dayAppointments.length === 0 && (
                  <div className="rounded-[10px] border border-dashed border-border-soft p-6 text-center text-[13px] text-faint">
                    Aucun RDV
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalAppointment && (
        <CancelModal
          appointment={modalAppointment}
          onClose={() => setModalAppointment(null)}
          onConfirm={async () => {
            await gqlRequest(CANCEL_AS_ADMIN_MUTATION, { id: modalAppointment.id });
            setModalAppointment(null);
            await refetch();
          }}
        />
      )}
    </>
  );
}
