"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getCycleEntries, saveCycleEntry, MenstrualEntryDto } from "@/lib/menstrualEntries";
import { getCycleHistory, MenstrualCycleDto } from "@/lib/menstrualCycle";

const PHASE_ORDER = ["MENSTRUAL", "FOLLICULAR", "OVULATORY", "LUTEAL"] as const;
type Phase = typeof PHASE_ORDER[number];

const PHASE_META: Record<Phase, { label: string; emoji: string; border: string; bg: string; text: string }> = {
  MENSTRUAL: {
    label: "Fase menstrual",
    emoji: "🔴",
    border: "border-red-700/40",
    bg: "bg-red-900/20",
    text: "text-red-300",
  },
  FOLLICULAR: {
    label: "Fase folicular",
    emoji: "🟡",
    border: "border-yellow-700/40",
    bg: "bg-yellow-900/20",
    text: "text-yellow-300",
  },
  OVULATORY: {
    label: "Fase ovulatoria",
    emoji: "🟢",
    border: "border-emerald-700/40",
    bg: "bg-emerald-900/20",
    text: "text-emerald-300",
  },
  LUTEAL: {
    label: "Fase lútea",
    emoji: "🔵",
    border: "border-blue-700/40",
    bg: "bg-blue-900/20",
    text: "text-blue-300",
  },
};

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

function todayLocalDate() {
  return toLocalDateString(new Date());
}

function addDays(dateStr: string, days: number) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);

  return toLocalDateString(date);
}

function daysBetween(startDate: string, endDate: string) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDaysInCycle(
  cycle: MenstrualCycleDto,
  nextCycle: MenstrualCycleDto | null
): string[] {
  const days: string[] = [];
  const today = parseLocalDate(todayLocalDate());

  const endDate = nextCycle
    ? addDays(nextCycle.startDate, -1)
    : todayLocalDate();

  const lastDate = parseLocalDate(endDate);
  const safeLastDate = lastDate > today ? today : lastDate;

  const totalDays = daysBetween(
    cycle.startDate,
    toLocalDateString(safeLastDate)
  ) + 1;

  if (totalDays <= 0) {
    return days;
  }

  for (let i = 0; i < totalDays; i++) {
    days.push(addDays(cycle.startDate, i));
  }

  return days;
}

function calculateCycleDay(startDate: string, entryDate: string): number {
  return daysBetween(startDate, entryDate) + 1;
}

function calculatePhase(cycleDay: number, bleedingDays: number, cycleLength: number): Phase {
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

type EntryForm = {
  painLevel: number;
  fatigueLevel: number;
  flowLevel: number;
  mood: number;
  notes: string;
};

const EMPTY_FORM: EntryForm = {
  painLevel: 0,
  fatigueLevel: 0,
  flowLevel: 0,
  mood: 0,
  notes: "",
};

export default function CycleDiaryPage() {
  const router = useRouter();
  const params = useParams();
  const cycleId = Number(params.cycleId);
  const { user } = useCurrentUser();

  const [allCycles, setAllCycles] = useState<MenstrualCycleDto[]>([]);
  const [cycle, setCycle] = useState<MenstrualCycleDto | null>(null);
  const [entries, setEntries] = useState<MenstrualEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const athleteId = user?.athleteProfileId;

  useEffect(() => {
    if (!athleteId) {
      setLoading(false);
      return;
    }

    Promise.all([
      getCycleHistory(athleteId),
      getCycleEntries(athleteId, cycleId),
    ])
      .then(([history, ents]) => {
        const sorted = [...history].sort(
          (a, b) => parseLocalDate(b.startDate).getTime() - parseLocalDate(a.startDate).getTime()
        );

        setAllCycles(sorted);
        setCycle(sorted.find((c) => c.id === cycleId) ?? null);
        setEntries(ents);
      })
      .catch(() => setError("No se han podido cargar los datos."))
      .finally(() => setLoading(false));
  }, [athleteId, cycleId]);

  const currentIndex = allCycles.findIndex((c) => c.id === cycleId);

  const prevCycle =
    currentIndex >= 0 && currentIndex < allCycles.length - 1
      ? allCycles[currentIndex + 1]
      : null;

  const nextCycle =
    currentIndex > 0
      ? allCycles[currentIndex - 1]
      : null;

  function openEdit(date: string) {
    const existing = entries.find((e) => e.date === date);

    setForm(
      existing
        ? {
            painLevel: existing.painLevel ?? 0,
            fatigueLevel: existing.fatigueLevel ?? 0,
            flowLevel: existing.flowLevel ?? 0,
            mood: existing.mood ?? 0,
            notes: existing.notes ?? "",
          }
        : EMPTY_FORM
    );

    setEditingDate(date);
  }

  async function handleSave() {
    if (!athleteId || !editingDate || !cycle) return;

    setSaving(true);

    try {
      const saved = await saveCycleEntry(athleteId, cycleId, {
        date: editingDate,
        painLevel: form.painLevel || null,
        fatigueLevel: form.fatigueLevel || null,
        flowLevel: form.flowLevel || null,
        mood: form.mood || null,
        notes: form.notes || null,
      });

      setEntries((prev) => {
        const index = prev.findIndex((entry) => entry.date === editingDate);

        if (index >= 0) {
          return prev.map((entry, i) => (i === index ? saved : entry));
        }

        return [...prev, saved];
      });

      setEditingDate(null);
    } catch {
      setError("No se ha podido guardar la entrada.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900">
        <p className="text-sm text-slate-300">Cargando diario...</p>
      </div>
    );
  }

  const days = cycle ? getDaysInCycle(cycle, nextCycle) : [];
  const entryByDate = Object.fromEntries(entries.map((entry) => [entry.date, entry]));

  const byPhase: Record<Phase, { date: string; dayNum: number }[]> = {
    MENSTRUAL: [],
    FOLLICULAR: [],
    OVULATORY: [],
    LUTEAL: [],
  };

  days.forEach((date) => {
    const cycleDay = cycle ? calculateCycleDay(cycle.startDate, date) : 1;
    const phase = calculatePhase(
      cycleDay,
      cycle?.bleedingDays ?? 5,
      cycle?.cycleLength ?? 28
    );

    byPhase[phase].push({ date, dayNum: cycleDay });
  });

  const editingCycleDay =
    cycle && editingDate
      ? calculateCycleDay(cycle.startDate, editingDate)
      : null;

  const editingPhase =
    editingCycleDay && cycle
      ? calculatePhase(
          editingCycleDay,
          cycle.bleedingDays ?? 5,
          cycle.cycleLength ?? 28
        )
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Diario del ciclo
            </p>

            <h1 className="text-2xl font-semibold">
              {cycle ? `Ciclo desde ${formatDate(cycle.startDate)}` : "Ciclo"}
            </h1>

            <p className="text-xs text-slate-400">
              Toca un día para añadir o editar cómo te encontraste.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/athlete")}
            className="text-[11px] text-slate-300 hover:text-slate-100 underline flex-shrink-0"
          >
            Volver al panel →
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
          <button
            type="button"
            onClick={() => prevCycle && router.push(`/athlete/menstrual/${prevCycle.id}`)}
            disabled={!prevCycle}
            className="text-[11px] text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:cursor-default flex items-center gap-1"
          >
            ← {prevCycle ? formatDate(prevCycle.startDate) : "Ciclo anterior"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/athlete/menstrual")}
            className="text-[11px] text-sky-400 hover:text-sky-300"
          >
            Ver todos
          </button>

          <button
            type="button"
            onClick={() => nextCycle && router.push(`/athlete/menstrual/${nextCycle.id}`)}
            disabled={!nextCycle}
            className="text-[11px] text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:cursor-default flex items-center gap-1"
          >
            {nextCycle ? formatDate(nextCycle.startDate) : "Ciclo siguiente"} →
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {days.length === 0 && (
          <p className="text-sm text-slate-400">
            No hay días registrados para este ciclo todavía.
          </p>
        )}

        {PHASE_ORDER.map((phase) => {
          const phaseDays = byPhase[phase];

          if (phaseDays.length === 0) return null;

          const meta = PHASE_META[phase];

          return (
            <div key={phase} className={`border rounded-2xl overflow-hidden ${meta.border}`}>
              <div className={`px-4 py-2.5 ${meta.bg} flex items-center gap-2`}>
                <span className="text-base">{meta.emoji}</span>

                <p className={`text-xs font-semibold uppercase tracking-wider ${meta.text}`}>
                  {meta.label}
                </p>

                <span className="text-[10px] text-slate-500 ml-auto">
                  {phaseDays.length} día{phaseDays.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {phaseDays.map(({ date, dayNum }) => {
                  const entry = entryByDate[date];
                  const hasData = !!entry;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => openEdit(date)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">
                              Día {dayNum}
                            </span>

                            <span className="text-sm font-medium text-slate-100">
                              {formatDate(date)}
                            </span>
                          </div>

                          {hasData ? (
                            <div className="flex flex-wrap gap-3 mt-0.5 text-[11px] text-slate-300">
                              {entry.painLevel ? (
                                <span>Dolor {entry.painLevel}/10</span>
                              ) : null}

                              {entry.fatigueLevel ? (
                                <span>Fatiga {entry.fatigueLevel}/10</span>
                              ) : null}

                              {entry.mood ? (
                                <span>Ánimo {entry.mood}/10</span>
                              ) : null}

                              {entry.notes ? (
                                <span className="italic text-slate-500">
                                  &quot;{entry.notes}&quot;
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Sin datos · Toca para añadir
                            </p>
                          )}
                        </div>

                        <span className={`text-base ml-3 flex-shrink-0 ${hasData ? "text-sky-400" : "text-slate-600"}`}>
                          {hasData ? "✏️" : "+"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                {formatDate(editingDate)}
              </h2>

              {editingPhase && (
                <p className={`text-xs mt-0.5 ${PHASE_META[editingPhase].text}`}>
                  {PHASE_META[editingPhase].emoji} {PHASE_META[editingPhase].label}
                </p>
              )}

              <p className="text-xs text-slate-400 mt-0.5">
                Anota cómo te encontraste. 0 = sin datos.
              </p>
            </div>

            {(["painLevel", "fatigueLevel", "flowLevel", "mood"] as const).map((field) => {
              const labels: Record<string, string> = {
                painLevel: "Dolor (0-10)",
                fatigueLevel: "Fatiga (0-10)",
                flowLevel: "Flujo (0-10)",
                mood: "Ánimo (0-10)",
              };

              return (
                <div key={field}>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {labels[field]}
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={form[field]}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          [field]: Number(event.target.value),
                        }))
                      }
                      className="flex-1 accent-sky-500"
                    />

                    <span className="text-sm font-semibold text-slate-100 w-5 text-center">
                      {form[field] || "–"}
                    </span>
                  </div>
                </div>
              );
            })}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Notas (opcional)
              </label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    notes: event.target.value,
                  }))
                }
                rows={2}
                placeholder="Cómo te has sentido, qué has notado..."
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 resize-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingDate(null)}
                className="flex-1 border border-slate-700 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}