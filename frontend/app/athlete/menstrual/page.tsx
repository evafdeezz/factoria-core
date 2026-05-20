"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getCycleHistory, MenstrualCycleDto } from "@/lib/menstrualCycle";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Phase = "MENSTRUAL" | "FOLLICULAR" | "OVULATORY" | "LUTEAL";

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateStr: string, days: number) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

function daysBetween(startDateStr: string, endDateStr: string) {
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  return Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getPhaseForDay(
  cycleDay: number,
  bleedingDays: number,
  cycleLength: number
): Phase {
  const ovulationDay = Math.max(1, cycleLength - 14);
  const ovulationStart = Math.max(bleedingDays + 1, ovulationDay - 1);
  const ovulationEnd = ovulationDay + 1;

  if (cycleDay <= bleedingDays) {
    return "MENSTRUAL";
  }

  if (cycleDay < ovulationStart) {
    return "FOLLICULAR";
  }

  if (cycleDay <= ovulationEnd) {
    return "OVULATORY";
  }

  return "LUTEAL";
}

const PHASE_BAR: Record<Phase, string> = {
  MENSTRUAL: "bg-red-400",
  FOLLICULAR: "bg-yellow-400",
  OVULATORY: "bg-emerald-400",
  LUTEAL: "bg-blue-400",
};

const PHASE_SELECTED_BG: Record<Phase, string> = {
  MENSTRUAL: "bg-red-600/30 border border-red-500/60",
  FOLLICULAR: "bg-yellow-600/20 border border-yellow-500/40",
  OVULATORY: "bg-emerald-600/20 border border-emerald-500/40",
  LUTEAL: "bg-blue-600/20 border border-blue-500/40",
};

const PHASE_LABELS: Record<Phase, string> = {
  MENSTRUAL: "Menstrual 🔴",
  FOLLICULAR: "Folicular 🟡",
  OVULATORY: "Ovulatoria 🟢",
  LUTEAL: "Lútea 🔵",
};

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function formatDateLong(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSelectedDateLabel(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
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

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== "ATHLETE") {
      setLoading(false);
      return;
    }

    const athleteId = Number(user.athleteProfileId);
    if (Number.isNaN(athleteId)) {
      setLoading(false);
      return;
    }

    async function loadCycles() {
      try {
        setLoading(true);
        setError(null);

        const data = await getCycleHistory(athleteId);
        const sorted = [...data].sort(
          (a, b) => parseLocalDate(b.startDate).getTime() - parseLocalDate(a.startDate).getTime()
        );

        setCycles(sorted);

        if (sorted.length > 0) {
          const latest = sorted[0];
          const anchorDate = parseLocalDate(latest.startDate);

          setViewYear(anchorDate.getFullYear());
          setViewMonth(anchorDate.getMonth());
          setSelectedDate(latest.startDate);
        }
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial.");
      } finally {
        setLoading(false);
      }
    }

    void loadCycles();
  }, [user, userLoading]);

  const cyclesByDate = useMemo(() => {
    const map: Record<string, MenstrualCycleDto[]> = {};

    for (const cycle of cycles) {
      if (!map[cycle.startDate]) map[cycle.startDate] = [];
      map[cycle.startDate].push(cycle);
    }

    return map;
  }, [cycles]);

  // Días menstruales SOLO del ciclo más reciente, para fondo rojo completo.
  const currentMenstrualDates = useMemo(() => {
    const set = new Set<string>();

    if (cycles.length === 0) return set;

    const current = cycles[0];
    const bleeding = current.bleedingDays ?? 5;

    for (let i = 0; i < bleeding; i++) {
      set.add(addDays(current.startDate, i));
    }

    return set;
  }, [cycles]);

  // Mapa fecha → fase. Los ciclos más recientes tienen prioridad.
  const datePhaseMap = useMemo(() => {
    const map: Record<string, Phase> = {};

    for (let ci = 0; ci < cycles.length; ci++) {
      const cycle = cycles[ci];
      const length = cycle.cycleLength ?? 28;
      const bleeding = cycle.bleedingDays ?? 5;
      const nextCycleStart = ci > 0 ? cycles[ci - 1].startDate : null;

      let daysToRender = length;

      if (nextCycleStart) {
        const gap = daysBetween(cycle.startDate, nextCycleStart);
        daysToRender = Math.max(gap, length);
      }

      for (let i = 0; i < daysToRender; i++) {
        const date = addDays(cycle.startDate, i);

        if (!(date in map)) {
          map[date] =
            i >= length
              ? "LUTEAL"
              : getPhaseForDay(i + 1, bleeding, length);
        }
      }
    }

    return map;
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

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

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
        <Link href="/login" className="text-xs text-sky-300 underline">
          Ir al login →
        </Link>
      </div>
    );
  }

  if (user.role !== "ATHLETE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Solo disponible para atletas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Ciclo menstrual
            </p>
            <h1 className="text-2xl font-semibold">Calendario menstrual</h1>
            <p className="text-[11px] text-slate-400">
              Toca un día del calendario para ver los ciclos registrados.
            </p>
          </div>

          <Link
            href="/athlete"
            className="text-xs text-slate-300 hover:text-slate-100 underline flex-shrink-0"
          >
            Volver al panel →
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
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 transition-colors"
            >
              ‹
            </button>

            <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
              {MONTHS_ES[viewMonth]} {viewYear}
            </h2>

            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 transition-colors"
            >
              ›
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Menstrual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Folicular
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ovulatoria
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Lútea
            </span>
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
              if (day === null) return <div key={`empty-${index}`} />;

              const key = dateKey(day);
              const dayCycles = cyclesByDate[key] ?? [];
              const hasCycleStart = dayCycles.length > 0;
              const isSelected = selectedDate === key;
              const todayCell = isToday(day);
              const phase = datePhaseMap[key];
              const isCurrentMenstrual = currentMenstrualDates.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={[
                    "relative flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all duration-150",
                    isSelected
                      ? phase
                        ? PHASE_SELECTED_BG[phase]
                        : "bg-slate-700/40 border border-slate-600"
                      : isCurrentMenstrual
                        ? "bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
                        : "border border-transparent hover:bg-slate-800/20",
                    todayCell && !isSelected ? "ring-1 ring-sky-500/60" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      todayCell
                        ? "bg-sky-500 text-white font-bold"
                        : isSelected
                          ? phase
                            ? "text-slate-100"
                            : "text-slate-300"
                          : phase
                            ? "text-slate-100"
                            : "text-slate-500",
                    ].join(" ")}
                  >
                    {day}
                  </span>

                  {phase && !isCurrentMenstrual && !isSelected && (
                    <div className={`w-4 h-0.5 rounded-full mt-0.5 ${PHASE_BAR[phase]}`} />
                  )}

                  {hasCycleStart && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">
                {formatSelectedDateLabel(selectedDate)}
              </h3>

              {datePhaseMap[selectedDate] && (
                <span className="text-[11px] text-slate-400">
                  {PHASE_LABELS[datePhaseMap[selectedDate]]}
                </span>
              )}
            </div>

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
                            : "Duración no registrada"}
                          {cycle.bleedingDays
                            ? ` · ${cycle.bleedingDays} días de menstruación`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/athlete/menstrual/${cycle.id}`)}
                        className="text-[11px] font-medium text-sky-300 hover:text-sky-200 flex-shrink-0"
                      >
                        Ver diario →
                      </button>
                    </div>

                    {cycle.bleedingDays ? (
                      <p className="text-[11px] text-slate-400">
                        Ventana de sangrado estimada:{" "}
                        <span className="text-slate-300">
                          {formatDateShort(cycle.startDate)} –{" "}
                          {formatDateShort(addDays(cycle.startDate, cycle.bleedingDays - 1))}
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