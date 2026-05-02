"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAthletes, UserDto } from "@/lib/users";
import { getAthleteProfile } from "@/lib/athleteProfile";
import { getWellnessHistory, WellnessEntryDto } from "@/lib/wellness";
import { getResultsByAthlete, SessionResultDto } from "@/lib/sessionResults";
import { getAthleteSessions, TrainingSessionDto } from "@/lib/trainingSessions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

const STATUS_DOT: Record<string, string> = {
  PLANNED:   "bg-sky-400",
  PUBLISHED: "bg-indigo-400",
  COMPLETED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planificada", PUBLISHED: "Publicada",
  COMPLETED: "Completada", CANCELLED: "Cancelada",
};

const PHASE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  MENSTRUAL:  { bg: "bg-red-900/30",     border: "border-red-700/40",     text: "text-red-300"    },
  FOLLICULAR: { bg: "bg-yellow-900/30",  border: "border-yellow-700/40",  text: "text-yellow-300" },
  OVULATORY:  { bg: "bg-emerald-900/30", border: "border-emerald-700/40", text: "text-emerald-300"},
  LUTEAL:     { bg: "bg-blue-900/30",    border: "border-blue-700/40",    text: "text-blue-300"   },
};

// ─── Result display ───────────────────────────────────────────────────────────

interface ParsedBlock {
  blockId: number;
  mode: "time_series"|"weight_sets"|"notes"|"skip";
  times?: { value: string }[];
  sets?:  { reps: string; weight: string }[];
  text?:  string;
}

function parseTimeMain(raw?: string|null): ParsedBlock[]|null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (p.version === 2 && Array.isArray(p.blocks)) return p.blocks;
  } catch { /* legacy */ }
  return null;
}

function ResultBlocks({ timeMain }: { timeMain?: string|null }) {
  const blocks = parseTimeMain(timeMain);
  if (!blocks) return timeMain ? <p className="text-[11px] text-slate-300">{timeMain}</p> : null;
  const visible = blocks.filter(b => b.mode !== "skip");
  if (!visible.length) return null;
  return (
    <div className="space-y-0.5">
      {visible.map(b => (
        <div key={b.blockId} className="text-[11px]">
          {b.mode === "time_series" && b.times && (
            <span className="text-slate-200">
              {b.times.filter(t=>t.value).map((t,i)=>`${i+1}) ${t.value}`).join("  ·  ")||"—"}
            </span>
          )}
          {b.mode === "weight_sets" && b.sets && (
            <span className="text-slate-200">
              {b.sets.filter(s=>s.reps||s.weight).map((s,i)=>`${i+1}) ${s.reps||"?"}r × ${s.weight||"?"}kg`).join("  ·  ")||"—"}
            </span>
          )}
          {b.mode === "notes" && b.text && <span className="text-slate-300 italic">{b.text}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachAthleteDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const userId  = Number(params.athleteId);

  const [athlete,     setAthlete]     = useState<UserDto|null>(null);
  const [wellness,    setWellness]    = useState<WellnessEntryDto[]>([]);
  const [results,     setResults]     = useState<SessionResultDto[]>([]);
  const [sessions,    setSessions]    = useState<TrainingSessionDto[]>([]);
  const [cycleStatus, setCycleStatus] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string|null>(null);

  const today = new Date();
  const [viewYear,      setViewYear]      = useState(today.getFullYear());
  const [viewMonth,     setViewMonth]     = useState(today.getMonth());
  const [selectedDate,  setSelectedDate]  = useState<string|null>(null);
  const [showAllWellness, setShowAllWellness] = useState(false);

  useEffect(() => {
    if (Number.isNaN(userId)) return;
    async function load() {
      try {
        setLoading(true);
        const [athletesList, profile] = await Promise.all([
          getAthletes(),
          getAthleteProfile(userId),
        ]);
        setAthlete(athletesList.find(a => a.id === userId) ?? null);
        if (!profile?.id) { setLoading(false); return; }

        const pid = profile.id;
        const [wh, res, sess] = await Promise.all([
          getWellnessHistory(pid),
          getResultsByAthlete(pid),
          getAthleteSessions(pid),
        ]);
        setWellness([...wh].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()));
        setResults([...res].sort((a,b) => (b.id??0)-(a.id??0)));
        setSessions(sess);

        // Ciclo menstrual — silencioso si 403 (no compartido) o 204 (desactivado)
        try {
          const cr = await fetch(`${API_BASE_URL}/menstrual/${pid}/status`,
            { credentials:"include", cache:"no-store" });
          if (cr.ok) setCycleStatus(await cr.json());
        } catch { /* ignorar */ }

      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar la información del atleta.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [userId]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSessionDto[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const resultsBySession = useMemo(() => {
    const map = new Map<number, SessionResultDto>();
    for (const r of results) if (r.sessionId) map.set(r.sessionId, r);
    return map;
  }, [results]);

  const calendarDays   = buildCalendarDays(viewYear, viewMonth);
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate]??[]) : [];

  function prevMonth() {
    if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}
    else setViewMonth(m=>m-1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}
    else setViewMonth(m=>m+1);
    setSelectedDate(null);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando atleta...</p>
    </div>
  );
  if (!athlete) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <div className="space-y-2 text-center">
        <p className="text-sm">Atleta no encontrado.</p>
        <button onClick={()=>router.push("/coach")} className="text-xs text-sky-300 underline">Volver al panel</button>
      </div>
    </div>
  );

  const phaseStyle = cycleStatus?.phase ? PHASE_STYLES[cycleStatus.phase] : null;
  const rpeAvg = results.filter(r=>r.rpe).length > 0
    ? (results.reduce((s,r)=>s+(r.rpe??0),0)/results.filter(r=>r.rpe).length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Ficha de atleta</p>
            <h1 className="text-2xl md:text-3xl font-semibold">{athlete.fullName}</h1>
            <p className="text-xs text-slate-400">{athlete.email}</p>
          </div>
          <button onClick={()=>router.back()} className="text-xs text-slate-300 hover:text-slate-100 underline flex-shrink-0">
            ← Volver
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Columna izquierda (2/3) ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Ciclo menstrual — solo si compartido */}
            {cycleStatus && (
              <div className={`border rounded-2xl p-4 space-y-2 ${phaseStyle?.bg??"bg-slate-900/60"} ${phaseStyle?.border??"border-slate-800"}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">{cycleStatus.emoji}</span>
                  <div className="space-y-1">
                    <p className={`text-xs font-semibold ${phaseStyle?.text??"text-slate-300"}`}>
                      {cycleStatus.phaseLabel}
                      {!cycleStatus.isLate && (
                        <span className="text-slate-500 font-normal ml-1.5">Día {cycleStatus.cycleDay}/{cycleStatus.totalCycleLength}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{cycleStatus.training}</p>
                    {cycleStatus.warning && (
                      <p className="text-[11px] text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg px-2.5 py-1.5 mt-1">
                        ⚠️ {cycleStatus.warning}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Calendario */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button onClick={prevMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 text-lg">‹</button>
                <p className="text-sm font-semibold">{MONTHS_ES[viewMonth]} {viewYear}</p>
                <button onClick={nextMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700/60 text-slate-300 text-lg">›</button>
              </div>

              <div className="grid grid-cols-7">
                {DAYS_ES.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} />;
                  const key         = dateKey(viewYear, viewMonth, day);
                  const daySessions = sessionsByDate[key]??[];
                  const hasSession  = daySessions.length > 0;
                  const hasResult   = daySessions.some(s => resultsBySession.has(s.id));
                  const isSelected  = selectedDate === key;
                  const isToday     = today.getFullYear()===viewYear && today.getMonth()===viewMonth && today.getDate()===day;

                  return (
                    <button key={key}
                      onClick={() => hasSession ? setSelectedDate(isSelected ? null : key) : undefined}
                      className={[
                        "flex flex-col items-center justify-start pt-1 pb-1 rounded-xl mx-0.5 min-h-[3rem] transition-all",
                        isSelected ? "bg-sky-600/25 border border-sky-500/50" : "border border-transparent",
                        hasSession && !isSelected ? "hover:bg-slate-700/40 cursor-pointer" : "",
                        !hasSession ? "opacity-40 cursor-default" : "",
                      ].join(" ")}
                    >
                      <span className={[
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-sky-500 text-white font-bold" : isSelected ? "text-sky-300" : hasSession ? "text-slate-100" : "text-slate-500",
                      ].join(" ")}>{day}</span>
                      {daySessions.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                          {daySessions.slice(0,3).map((s,i) => (
                            <span key={i} className={[
                              "rounded-full transition-all",
                              hasResult ? "w-2 h-2 ring-1 ring-white/30" : "w-1.5 h-1.5",
                              STATUS_DOT[s.status??"PLANNED"]??STATUS_DOT["PLANNED"],
                            ].join(" ")} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(STATUS_DOT).map(([k,dot]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-[10px] text-slate-400">{STATUS_LABEL[k]}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 ring-1 ring-white/30" />
                  <span className="text-[10px] text-slate-400">Con resultado</span>
                </div>
              </div>
            </div>

            {/* Panel día seleccionado */}
            {selectedDate && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300">
                  {(() => { const [y,m,d] = selectedDate.split("-").map(Number); return `${d} de ${MONTHS_ES[m-1]} de ${y}`; })()}
                </h3>
                {selectedSessions.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin sesiones.</p>
                ) : selectedSessions.map(s => {
                  const result = resultsBySession.get(s.id);
                  return (
                    <div key={s.id} className="border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950/40 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-50">{s.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status??"PLANNED"]}`} />
                            <span className="text-[10px] text-slate-400">{STATUS_LABEL[s.status??"PLANNED"]}</span>
                          </div>
                        </div>
                        {result && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 flex-shrink-0">
                            ✓ Con resultado
                          </span>
                        )}
                      </div>
                      {result && (
                        <div className="border-t border-slate-800 pt-2 space-y-1.5">
                          {result.rpe && (
                            <p className="text-[11px] text-slate-400">
                              RPE <span className="text-slate-200 font-semibold">{result.rpe}</span>/10
                            </p>
                          )}
                          <ResultBlocks timeMain={result.timeMain} />
                          {result.comment && (
                            <p className="text-[11px] text-slate-400 italic">"{result.comment}"</p>
                          )}
                          {result.painFlag && (
                            <p className="text-[11px] text-red-300">
                              ⚠️ Reportó dolor{result.painNotes ? `: ${result.painNotes}` : ""}
                            </p>
                          )}
                        </div>
                      )}
                      {!result && s.status !== "CANCELLED" && (
                        <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-2">Sin resultado registrado.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Columna derecha (1/3) ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Stats */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resumen</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Sesiones",    value: sessions.length },
                  { label: "Resultados",  value: results.length },
                  { label: "% completado",value: sessions.length > 0 ? `${Math.round(results.length/sessions.length*100)}%` : "—" },
                  { label: "RPE medio",   value: rpeAvg },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-950/40 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-50">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Wellness reciente</p>
              {wellness.length === 0 ? (
                <p className="text-xs text-slate-400">Sin registros.</p>
              ) : (
                <div className="space-y-2">
                  {(showAllWellness ? wellness : wellness.slice(0,5)).map(w => (
                    <div key={w.id} className="border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/40">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-200">{w.date}</p>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          {w.fatigue  != null && <span title="Fatiga">💤 {w.fatigue}</span>}
                          {w.soreness != null && <span title="Dolor">💪 {w.soreness}</span>}
                          {w.stress   != null && <span title="Estrés">🧠 {w.stress}</span>}
                        </div>
                      </div>
                      {w.comment && <p className="text-[10px] text-slate-400 italic mt-0.5">"{w.comment}"</p>}
                    </div>
                  ))}
                  {wellness.length > 5 && (
                    <button onClick={() => setShowAllWellness(v=>!v)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 w-full text-center pt-1">
                      {showAllWellness ? "Ver menos ↑" : `Ver ${wellness.length-5} más ↓`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dolores reportados */}
            {results.some(r => r.painFlag) && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">⚠️ Dolores reportados</p>
                <div className="space-y-1.5">
                  {results.filter(r=>r.painFlag).slice(0,5).map(r => (
                    <div key={r.id} className="text-[11px] text-slate-300">
                      <span className="text-slate-500 mr-1">Sesión #{r.sessionId}:</span>
                      {r.painNotes||"Sin detalle"}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}