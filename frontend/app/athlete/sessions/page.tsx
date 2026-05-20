"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAthleteSessions, TrainingSessionDto } from "@/lib/trainingSessions";
import { getResultsByAthlete, SessionResultDto } from "@/lib/sessionResults";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─── Tipos sesión personal (provisional hasta tener el lib) ──────────────────
interface PersonalSessionDto {
  id: number;
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

async function getPersonalSessions(athleteId: number): Promise<PersonalSessionDto[]> {
  const res = await fetch(`${API_BASE_URL}/personal-sessions/athlete/${athleteId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return [];
  return res.json();
}

async function deletePersonalSession(id: number): Promise<void> {
  await fetch(`${API_BASE_URL}/personal-sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

async function createPersonalSession(data: {
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}): Promise<PersonalSessionDto> {
  const res = await fetch(`${API_BASE_URL}/personal-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo crear la sesión");
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Componente principal ─────────────────────────────────────────────────────

function AthleteSessionsCalendar() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();

  const initYear  = parseInt(searchParams.get("year")  ?? "") || today.getFullYear();
  const initMonth = parseInt(searchParams.get("month") ?? "") || today.getMonth();

  const [viewYear,  setViewYear]  = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [sessions,         setSessions]         = useState<TrainingSessionDto[]>([]);
  const [results,          setResults]          = useState<SessionResultDto[]>([]);
  const [personalSessions, setPersonalSessions] = useState<PersonalSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Modal nueva sesión personal
  const [showNewModal, setShowNewModal]   = useState(false);
  const [newForm, setNewForm] = useState<{
    title: string;
    type: "TRAINING" | "COMPETITION";
    notes: string;
    date: string;
  }>({ title: "", type: "TRAINING", notes: "", date: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [newError,  setNewError]  = useState<string | null>(null);

  const athleteId = user?.athleteProfileId;

  useEffect(() => {
    if (!athleteId) return;
    async function load() {
      try {
        setLoading(true);
        const [data, res, personal] = await Promise.all([
          getAthleteSessions(athleteId!),
          getResultsByAthlete(athleteId!),
          getPersonalSessions(athleteId!),
        ]);
        setSessions([...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setResults(res);
        setPersonalSessions(personal);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial de sesiones.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [athleteId]);

  // Índices por fecha
  const sessionsByDate: Record<string, TrainingSessionDto[]> = {};
  for (const s of sessions) {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  }

  const personalByDate: Record<string, PersonalSessionDto[]> = {};
  for (const p of personalSessions) {
    if (!personalByDate[p.date]) personalByDate[p.date] = [];
    personalByDate[p.date].push(p);
  }

  // IDs de sesiones con resultado registrado
  const sessionIdsWithResult = new Set(results.map((r) => r.sessionId));

  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  function dateKey(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  }

  function prevMonth() {
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const newYear  = viewMonth === 0 ? viewYear - 1 : viewYear;
    setViewMonth(newMonth); setViewYear(newYear); setSelectedDate(null);
    router.replace(`?year=${newYear}&month=${newMonth}`, { scroll: false });
  }
  function nextMonth() {
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const newYear  = viewMonth === 11 ? viewYear + 1 : viewYear;
    setViewMonth(newMonth); setViewYear(newYear); setSelectedDate(null);
    router.replace(`?year=${newYear}&month=${newMonth}`, { scroll: false });
  }

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  function openNewModal(date: string) {
    setNewForm({ title: "", type: "TRAINING", notes: "", date });
    setNewError(null);
    setShowNewModal(true);
  }

  async function handleCreatePersonal() {
    if (!athleteId || !newForm.title.trim()) {
      setNewError("El título es obligatorio.");
      return;
    }
    setSavingNew(true);
    setNewError(null);
    try {
      const created = await createPersonalSession({
        athleteId,
        date: newForm.date,
        title: newForm.title.trim(),
        type: newForm.type,
        notes: newForm.notes || null,
      });
      setPersonalSessions((prev) => [...prev, created]);
      setShowNewModal(false);
    } catch {
      setNewError("No se pudo guardar la sesión.");
    } finally {
      setSavingNew(false);
    }
  }

  async function handleDeletePersonal(id: number) {
    await deletePersonalSession(id);
    setPersonalSessions((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <Link href="/login" className="text-xs text-sky-300 underline">Ir al login →</Link>
    </div>
  );
  if (user.role !== "ATHLETE") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Solo disponible para atletas.</p>
    </div>
  );
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando historial...</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Sesiones · Factoría Core</p>
            <h1 className="text-2xl font-semibold">Historial de sesiones</h1>
          </div>
          <Link href="/athlete" className="text-xs text-slate-300 hover:text-slate-100 underline">
            Volver al día
          </Link>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Sesión del grupo</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Resultado registrado</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Entrenamiento propio</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" /> Competición</span>
        </div>

        {/* Calendario */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4">

          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 transition-colors">‹</button>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
              {MONTHS_ES[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 transition-colors">›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const key = dateKey(day);
              const daySessions  = sessionsByDate[key] ?? [];
              const dayPersonal  = personalByDate[key] ?? [];
              const hasGroup     = daySessions.length > 0;
              const hasPersonal  = dayPersonal.length > 0;
              const hasAnything  = hasGroup || hasPersonal;
              const isSelected   = selectedDate === key;
              const _isToday     = isToday(day);

              // ¿Alguna sesión del grupo tiene resultado?
              const anyResult = daySessions.some((s) => sessionIdsWithResult.has(s.id));

              return (
                <button
                  key={key}
                  onClick={() => hasAnything ? setSelectedDate(isSelected ? null : key) : undefined}
                  className={[
                    "relative flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all duration-150",
                    isSelected ? "bg-sky-600/30 border border-sky-500/60"
                      : hasAnything ? "hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50 cursor-pointer"
                      : "border border-transparent cursor-default opacity-60",
                    _isToday && !isSelected ? "border border-sky-500/40" : "",
                  ].join(" ")}
                >
                  <span className={[
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    _isToday ? "bg-sky-500 text-white font-bold"
                      : isSelected ? "text-sky-300"
                      : hasAnything ? "text-slate-100"
                      : "text-slate-500",
                  ].join(" ")}>
                    {day}
                  </span>

                  {/* Puntos de colores */}
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                    {daySessions.slice(0, 2).map((s, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${
                        sessionIdsWithResult.has(s.id) ? "bg-emerald-400" : "bg-sky-400"
                      }`} />
                    ))}
                    {dayPersonal.map((p, i) => (
                      <span key={`p-${i}`} className={`w-1.5 h-1.5 rounded-full ${
                        p.type === "COMPETITION" ? "bg-yellow-300" : "bg-amber-400"
                      }`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel día seleccionado */}
        {selectedDate && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">
                {(() => {
                  const [y, m, d] = selectedDate.split("-").map(Number);
                  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
                })()}
              </h3>
              <button
                onClick={() => openNewModal(selectedDate)}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                + Añadir sesión propia
              </button>
            </div>

            <div className="space-y-2">
              {/* Sesiones del grupo */}
              {(sessionsByDate[selectedDate] ?? []).map((session) => {
                const hasResult = sessionIdsWithResult.has(session.id);
                return (
                  <div key={session.id}
                    className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasResult ? "bg-emerald-400" : "bg-sky-400"}`} />
                      <div>
                        <p className="font-semibold text-slate-50">{session.title}</p>
                        {hasResult && <p className="text-[10px] text-emerald-400">Resultado registrado ✓</p>}
                      </div>
                    </div>
                    <Link
                      href={`/athlete/sessions/${session.id}?returnYear=${viewYear}&returnMonth=${viewMonth}`}
                      className="text-[11px] font-medium text-sky-300 hover:text-sky-200 ml-3 flex-shrink-0"
                    >
                      Ver →
                    </Link>
                  </div>
                );
              })}

              {/* Sesiones personales */}
              {(personalByDate[selectedDate] ?? []).map((p) => (
                <div key={p.id}
                  className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.type === "COMPETITION" ? "bg-yellow-300" : "bg-amber-400"}`} />
                    <div>
                      <p className="font-semibold text-slate-50">{p.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.type === "COMPETITION" ? "🏆 Competición" : "🏃 Entrenamiento propio"}
                      </p>
                      {p.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{p.notes}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePersonal(p.id)}
                    className="text-[11px] text-red-400 hover:text-red-300 ml-3 flex-shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              ))}

              {(sessionsByDate[selectedDate] ?? []).length === 0 &&
               (personalByDate[selectedDate] ?? []).length === 0 && (
                <p className="text-xs text-slate-500">Sin sesiones este día.</p>
              )}
            </div>
          </div>
        )}

        {sessions.length === 0 && personalSessions.length === 0 && !error && (
          <p className="text-sm text-slate-300">Todavía no tienes sesiones registradas.</p>
        )}
      </div>

      {/* Modal nueva sesión personal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-base font-semibold text-slate-50">Nueva sesión propia</h2>
              <p className="text-xs text-slate-400 mt-0.5">{newForm.date}</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Título *</label>
              <input
                type="text"
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Cross de San Silvestre, Gym..."
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Tipo</label>
              <div className="flex gap-2">
                {(["TRAINING", "COMPETITION"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewForm((f) => ({ ...f, type: t }))}
                    className={[
                      "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      newForm.type === t
                        ? t === "COMPETITION"
                          ? "bg-yellow-500/20 border-yellow-400 text-yellow-300"
                          : "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "border-slate-700 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {t === "COMPETITION" ? "🏆 Competición" : "🏃 Entrenamiento"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Notas (opcional)</label>
              <textarea
                value={newForm.notes}
                onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="60m — 7.45, resultado, sensaciones..."
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 resize-none placeholder:text-slate-600"
              />
            </div>

            {newError && <p className="text-xs text-red-300">{newError}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowNewModal(false)}
                className="flex-1 border border-slate-700 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
              <button type="button" onClick={handleCreatePersonal} disabled={savingNew}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
                {savingNew ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function AthleteSessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando...</p>
      </div>
    }>
      <AthleteSessionsCalendar />
    </Suspense>
  );
}