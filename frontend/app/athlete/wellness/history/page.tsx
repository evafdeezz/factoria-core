"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getWellnessHistory, WellnessEntryDto } from "@/lib/wellness";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WELLNESS_DOT = "bg-emerald-400";

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = (firstDay + 6) % 7; // lunes primero
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function formatSelectedDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

function scoreLabel(value?: number | null) {
  if (value == null) return "-";
  return String(value);
}

export default function WellnessHistoryPage() {
  const { user, loading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WellnessEntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [autoFocused, setAutoFocused] = useState(false);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user || user.role !== "ATHLETE") {
      setEntries([]);
      setLoading(false);
      return;
    }

    if (!user.athleteProfileId) {
      setEntries([]);
      setError(
        "No se ha encontrado athleteProfileId en el usuario actual. El backend debe devolverlo en /auth/me."
      );
      setLoading(false);
      return;
    }

    const athleteId = user.athleteProfileId;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getWellnessHistory(athleteId);

        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setEntries(sorted);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial de wellness.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, userLoading]);

  useEffect(() => {
    if (autoFocused) return;
    if (entries.length === 0) return;

    const latest = new Date(entries[0].date + "T00:00:00");
    setViewYear(latest.getFullYear());
    setViewMonth(latest.getMonth());
    setSelectedDate(entries[0].date);
    setAutoFocused(true);
  }, [entries, autoFocused]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WellnessEntryDto[]> = {};

    for (const entry of entries) {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    }

    return map;
  }, [entries]);

  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  function dateKey(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  }

  function prevMonth() {
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;

    setViewMonth(newMonth);
    setViewYear(newYear);
    setSelectedDate(null);
  }

  function nextMonth() {
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;

    setViewMonth(newMonth);
    setViewYear(newYear);
    setSelectedDate(null);
  }

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const selectedEntry = selectedEntries[0] ?? null;

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando historial…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-200">No has iniciado sesión.</p>
          <Link
            href="/login"
            className="text-xs text-sky-300 hover:text-sky-200 underline"
          >
            Ir a la pantalla de login →
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "ATHLETE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Esta pantalla solo está disponible para atletas.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Wellness · Factoría Core
            </p>
            <h1 className="text-2xl font-semibold">Historial de wellness</h1>
            <p className="text-[11px] text-slate-400">
              Toca un día del calendario para ver cómo llegaste al entrenamiento.
            </p>
          </div>

          <Link
            href="/athlete"
            className="text-xs text-slate-300 hover:text-slate-100 underline"
          >
            Volver al panel
          </Link>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
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

          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${WELLNESS_DOT}`} />
              <span>Día con registro de wellness</span>
            </div>
          </div>

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

          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const key = dateKey(day);
              const dayEntries = entriesByDate[key] ?? [];
              const hasEntry = dayEntries.length > 0;
              const isSelected = selectedDate === key;
              const todayCell = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={[
                    "relative flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all duration-150",
                    isSelected
                      ? "bg-emerald-600/20 border border-emerald-500/60"
                      : hasEntry
                      ? "hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50"
                      : "border border-transparent hover:bg-slate-800/40",
                    todayCell && !isSelected ? "border border-sky-500/40" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      todayCell
                        ? "bg-sky-500 text-white font-bold"
                        : isSelected
                        ? "text-emerald-300"
                        : hasEntry
                        ? "text-slate-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {day}
                  </span>

                  {hasEntry && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                      {dayEntries.slice(0, 3).map((entry, i) => (
                        <span
                          key={`${entry.id ?? key}-${i}`}
                          className={`w-1.5 h-1.5 rounded-full ${WELLNESS_DOT}`}
                        />
                      ))}
                      {dayEntries.length > 3 && (
                        <span className="text-[8px] text-slate-400">
                          +{dayEntries.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              {formatSelectedDateLabel(selectedDate)}
            </h3>

            {!selectedEntry ? (
              <p className="text-xs text-slate-500">
                No hay registro de wellness este día.
              </p>
            ) : (
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
                    <p className="text-[11px] text-slate-400">Sueño</p>
                    <p className="font-semibold text-slate-50">
                      {selectedEntry.sleepHours ?? "-"} h
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
                    <p className="text-[11px] text-slate-400">Fatiga</p>
                    <p className="font-semibold text-slate-50">
                      {scoreLabel(selectedEntry.fatigue)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
                    <p className="text-[11px] text-slate-400">Dolor</p>
                    <p className="font-semibold text-slate-50">
                      {scoreLabel(selectedEntry.soreness)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
                    <p className="text-[11px] text-slate-400">Estrés</p>
                    <p className="font-semibold text-slate-50">
                      {scoreLabel(selectedEntry.stress)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-slate-400">Ánimo</p>
                    <p className="font-semibold text-slate-50">
                      {scoreLabel(selectedEntry.mood)}
                    </p>
                  </div>
                </div>

                {selectedEntry.comment ? (
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-3">
                    <p className="text-[11px] text-slate-400 mb-1">Comentario</p>
                    <p className="text-sm text-slate-200 italic">
                      “{selectedEntry.comment}”
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No dejaste comentario este día.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {entries.length === 0 && !error && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-300">
              No hay registros todavía. Cuando guardes wellness, aparecerá
              marcado en el calendario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}