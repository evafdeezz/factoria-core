"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAthleteSessions,
  TrainingSessionDto,
} from "@/lib/trainingSessions";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  PLANNED:   { dot: "bg-sky-400",    badge: "bg-sky-900/60 text-sky-300 border-sky-700/50",    label: "Planificada" },
  PUBLISHED: { dot: "bg-indigo-400", badge: "bg-indigo-900/60 text-indigo-300 border-indigo-700/50", label: "Publicada" },
  COMPLETED: { dot: "bg-emerald-400",badge: "bg-emerald-900/60 text-emerald-300 border-emerald-700/50", label: "Completada" },
  CANCELLED: { dot: "bg-red-400",    badge: "bg-red-900/60 text-red-300 border-red-700/50",    label: "Cancelada" },
};

function getDotStyle(status?: string) {
  return STATUS_STYLES[status ?? ""] ?? STATUS_STYLES["PLANNED"];
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  // Month is 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-first (0=Mon … 6=Sun)
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AthleteSessionsPage() {
  const { user } = useCurrentUser();

  const [sessions, setSessions] = useState<TrainingSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const athleteId = user?.athleteProfileId;

  useEffect(() => {
    if (!athleteId) return;
    async function load() {
      try {
        setLoading(true);
        const data = await getAthleteSessions(athleteId!);
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(sorted);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial de sesiones.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [athleteId]);

  // Index sessions by date string "YYYY-MM-DD"
  const sessionsByDate: Record<string, TrainingSessionDto[]> = {};
  for (const s of sessions) {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  }

  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  }

  function dateKey(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  }

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : [];

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  // ── Guards ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-200">No has iniciado sesión.</p>
          <Link href="/login" className="text-xs text-sky-300 hover:text-sky-200 underline">
            Ir a la pantalla de login →
          </Link>
        </div>
      </div>
    );
  }
  if (user.role !== "ATHLETE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Esta pantalla solo está disponible para atletas.</p>
      </div>
    );
  }
  if (!user.athleteProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Aún no tienes perfil de atleta. Completa tu configuración en Ajustes.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando historial de sesiones...</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Sesiones · Factoría Core
            </p>
            <h1 className="text-2xl font-semibold">Historial de sesiones</h1>
          </div>
          <Link href="/athlete" className="text-xs text-slate-300 hover:text-slate-100 underline">
            Volver al día
          </Link>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Calendar card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
              {MONTHS_ES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const key = dateKey(day);
              const daySessions = sessionsByDate[key] ?? [];
              const hasSession = daySessions.length > 0;
              const isSelected = selectedDate === key;
              const _isToday = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={[
                    "relative flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all duration-150",
                    isSelected
                      ? "bg-sky-600/30 border border-sky-500/60"
                      : hasSession
                      ? "hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50 cursor-pointer"
                      : "border border-transparent cursor-default opacity-60",
                    _isToday && !isSelected
                      ? "border border-sky-500/40"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      _isToday
                        ? "bg-sky-500 text-white font-bold"
                        : isSelected
                        ? "text-sky-300"
                        : hasSession
                        ? "text-slate-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {day}
                  </span>

                  {/* Session dots */}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                      {daySessions.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${getDotStyle(s.status).dot}`}
                        />
                      ))}
                      {daySessions.length > 3 && (
                        <span className="text-[8px] text-slate-400">+{daySessions.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(STATUS_STYLES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                <span className="text-[10px] text-slate-400">{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day sessions panel */}
        {selectedDate && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              {(() => {
                const [y, m, d] = selectedDate.split("-").map(Number);
                return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
              })()}
            </h3>

            {selectedSessions.length === 0 ? (
              <p className="text-xs text-slate-500">Sin sesiones este día.</p>
            ) : (
              <div className="space-y-2">
                {selectedSessions.map((session) => {
                  const style = getDotStyle(session.status);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        <div>
                          <p className="font-semibold text-slate-50">{session.title}</p>
                          {session.status && (
                            <span
                              className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded border ${style.badge}`}
                            >
                              {STATUS_STYLES[session.status]?.label ?? session.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/athlete/sessions/${session.id}`}
                        className="text-[11px] font-medium text-sky-300 hover:text-sky-200 ml-3 flex-shrink-0"
                      >
                        Ver →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !error && (
          <p className="text-sm text-slate-300">Todavía no tienes sesiones registradas.</p>
        )}

      </div>
    </div>
  );
}