"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getCycleHistory, MenstrualCycleDto } from "@/lib/menstrualCycle";

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

const CYCLE_DOT = "bg-rose-400";
const BLEEDING_BG = "bg-rose-500/15 border border-rose-500/20";

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSelectedDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function MenstrualHistoryPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [cycles, setCycles] = useState<MenstrualCycleDto[]>([]);
  const [loading, setLoading] = useState(true);
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
      setCycles([]);
      setLoading(false);
      return;
    }

    const athleteIdRaw = user.athleteProfileId;

    if (athleteIdRaw === null || athleteIdRaw === undefined) {
      setCycles([]);
      setLoading(false);
      setError("No se ha encontrado el perfil de atleta.");
      return;
    }

    const athleteId = Number(athleteIdRaw);

    if (Number.isNaN(athleteId)) {
      setCycles([]);
      setLoading(false);
      setError("El identificador del perfil de atleta no es válido.");
      return;
    }

    async function loadCycles(profileId: number) {
      try {
        setLoading(true);
        setError(null);

        const data = await getCycleHistory(profileId);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        setCycles(sorted);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial.");
      } finally {
        setLoading(false);
      }
    }

    void loadCycles(athleteId);
  }, [user, userLoading]);

  useEffect(() => {
    if (autoFocused) {
      return;
    }

    if (cycles.length === 0) {
      return;
    }

    const latest = cycles[0];
    const anchorDate = new Date(latest.startDate + "T00:00:00");

    setViewYear(anchorDate.getFullYear());
    setViewMonth(anchorDate.getMonth());
    setSelectedDate(latest.startDate);
    setAutoFocused(true);
  }, [cycles, autoFocused]);

  const cyclesByDate = useMemo(() => {
    const map: Record<string, MenstrualCycleDto[]> = {};

    for (const cycle of cycles) {
      if (!map[cycle.startDate]) {
        map[cycle.startDate] = [];
      }

      map[cycle.startDate].push(cycle);
    }

    return map;
  }, [cycles]);

  const bleedingDates = useMemo(() => {
    const dates = new Set<string>();

    for (const cycle of cycles) {
      const bleedingDays = cycle.bleedingDays ?? 0;

      for (let i = 0; i < bleedingDays; i++) {
        dates.add(addDays(cycle.startDate, i));
      }
    }

    return dates;
  }, [cycles]);

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

  const selectedCycles = selectedDate ? cyclesByDate[selectedDate] ?? [] : [];

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900">
        <p className="text-sm text-slate-300">Cargando historial...</p>
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Ciclo menstrual
            </p>
            <h1 className="text-2xl font-semibold">Historial de ciclos</h1>
            <p className="text-[11px] text-slate-400">
              Toca un día del calendario para ver los ciclos registrados.
            </p>
          </div>

          <Link
            href="/athlete"
            className="text-xs text-slate-300 hover:text-slate-100 underline flex-shrink-0"
          >
            Volver al panel
          </Link>
        </div>

        {error && (
          <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
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
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${CYCLE_DOT}`} />
              <span>Inicio de período</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-rose-500/30 bg-rose-500/15" />
              <span>Días de menstruación</span>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }

              const key = dateKey(day);
              const dayCycles = cyclesByDate[key] ?? [];
              const hasCycleStart = dayCycles.length > 0;
              const isSelected = selectedDate === key;
              const todayCell = isToday(day);
              const isBleedingDay = bleedingDates.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={[
                    "relative flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all duration-150",
                    isSelected
                      ? "bg-rose-600/20 border border-rose-500/60"
                      : hasCycleStart || isBleedingDay
                      ? "hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50"
                      : "border border-transparent hover:bg-slate-800/40",
                    todayCell && !isSelected ? "border border-sky-500/40" : "",
                    isBleedingDay && !isSelected ? BLEEDING_BG : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      todayCell
                        ? "bg-sky-500 text-white font-bold"
                        : isSelected
                        ? "text-rose-300"
                        : hasCycleStart || isBleedingDay
                        ? "text-slate-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {day}
                  </span>

                  {hasCycleStart && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                      {dayCycles.slice(0, 3).map((cycle) => (
                        <span
                          key={cycle.id}
                          className={`w-1.5 h-1.5 rounded-full ${CYCLE_DOT}`}
                        />
                      ))}

                      {dayCycles.length > 3 && (
                        <span className="text-[8px] text-slate-400">
                          +{dayCycles.length - 3}
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

            {selectedCycles.length === 0 ? (
              <p className="text-xs text-slate-500">
                No hay inicio de ciclo registrado este día.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedCycles.map((cycle, index) => (
                  <div
                    key={cycle.id}
                    className="rounded-xl bg-slate-950/40 border border-slate-800 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-rose-300 font-medium">
                          {index === 0 ? "Período registrado" : "Ciclo"}
                        </p>

                        <p className="text-sm font-semibold text-slate-100">
                          Inicio: {formatDateLong(cycle.startDate)}
                        </p>

                        <p className="text-xs text-slate-400 mt-0.5">
                          {cycle.cycleLength
                            ? `${cycle.cycleLength} días de ciclo`
                            : "Duración del ciclo no registrada"}

                          {cycle.bleedingDays
                            ? ` · ${cycle.bleedingDays} días de menstruación`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/athlete/menstrual/${cycle.id}`)
                        }
                        className="text-[11px] font-medium text-sky-300 hover:text-sky-200 flex-shrink-0"
                      >
                        Ver diario →
                      </button>
                    </div>

                    {cycle.bleedingDays ? (
                      <p className="text-[11px] text-slate-400">
                        Ventana de sangrado estimada:{" "}
                        <span className="text-slate-300">
                          {formatDateShort(cycle.startDate)} -{" "}
                          {formatDateShort(
                            addDays(cycle.startDate, cycle.bleedingDays - 1)
                          )}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {cycles.length === 0 && !error && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400">
              Aún no hay ciclos registrados. Cuando registres tu primer período,
              aparecerá marcado en el calendario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
