"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroup, GroupDto, deleteGroup } from "@/lib/groups";
import { getGroupMembersDetailed, GroupMemberDetailDto } from "@/lib/groupMembers";
import { TrainingSessionDto } from "@/lib/trainingSessions";

// URL base de la API. Si no existe variable de entorno, usamos la URL de producción.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Textos del calendario en español para mostrar los días y meses en la interfaz.
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Construye las celdas del calendario del mes actual.
// Los null representan huecos antes del día 1 o después del último día del mes.
function buildCalendarDays(year: number, month: number): (number | null)[] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);

  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

// Devuelve una fecha en formato YYYY-MM-DD para poder comparar sesiones por día.
function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// Color del punto que marca los días con sesiones en el calendario.
const SESSION_DOT = "bg-sky-400";

export default function GroupDashboardPage() {
  const params  = useParams();
  const router  = useRouter();
  const groupId = Number(params.groupId);

  // Estado principal de la pantalla: grupo, miembros y sesiones asociadas.
  const [group,       setGroup]       = useState<GroupDto | null>(null);
  const [members,     setMembers]     = useState<GroupMemberDetailDto[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSessionDto[]>([]);

  // Estados de control para carga, errores y acciones de borrado.
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // Estado del calendario: mes visible y día seleccionado.
  const today = new Date();
  const [viewYear,     setViewYear]     = useState(today.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Carga los datos del grupo, sus miembros y sus sesiones al entrar en la página.
  useEffect(() => {
    if (Number.isNaN(groupId)) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Hacemos las tres peticiones a la vez para que la pantalla cargue más rápido.
        const [g, mem, allRes] = await Promise.all([
          getGroup(groupId),
          getGroupMembersDetailed(groupId),
          fetch(`${API_BASE_URL}/sessions/group/${groupId}`, { cache: "no-store", credentials: "include" })
            .then(r => r.ok ? r.json() : []),
        ]);

        setGroup(g);
        setMembers(mem);

        // Ordenamos las sesiones de más reciente a más antigua.
        setAllSessions([...(allRes as TrainingSessionDto[])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el grupo.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [groupId]);

  // Agrupa las sesiones por fecha para encontrarlas rápido al pintar el calendario.
  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSessionDto[]> = {};

    for (const s of allSessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }

    return map;
  }, [allSessions]);

  const calendarDays     = buildCalendarDays(viewYear, viewMonth);
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : [];
  const todayKey         = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Cambia al mes anterior y limpia la selección del día.
  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }

    setSelectedDate(null);
  }

  // Cambia al mes siguiente y limpia la selección del día.
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }

    setSelectedDate(null);
  }

  // Elimina el grupo completo y vuelve al panel del entrenador si todo va bien.
  const handleDeleteGroup = async () => {
    try {
      setDeleting(true);
      await deleteGroup(groupId);
      router.push("/coach");
    } catch {
      setError("No se ha podido eliminar el grupo.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Elimina una sesión concreta y actualiza la lista local sin recargar la página.
  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;

    try {
      setDeletingId(sessionId);

      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      setAllSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
      setError("No se ha podido eliminar la sesión.");
    } finally {
      setDeletingId(null);
    }
  };

  // Pantalla sencilla mientras se están cargando los datos.
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando grupo...</p>
    </div>
  );

  // Si no encontramos el grupo, mostramos un mensaje y un botón para volver.
  if (!group) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-200">Grupo no encontrado.</p>
        <button onClick={() => router.push("/coach")} className="text-xs text-sky-300 underline">Volver</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Cabecera principal con acciones rápidas del grupo. */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Grupo</p>
            <h1 className="text-2xl md:text-3xl font-semibold">{group.name}</h1>
            <p className="text-xs text-slate-400">
              {group.competitionCategory ?? "Sin categoría"} · {group.discipline ?? "Sin disciplina"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/coach/groups/${groupId}/new-session`)}
              className="text-xs bg-sky-600 text-white px-4 py-2 rounded-full hover:bg-sky-700 font-semibold">
              + Nueva sesión
            </button>
            <button onClick={() => router.push(`/coach/groups/${groupId}/edit`)}
              className="text-xs text-sky-300 hover:text-sky-200 underline">
              Editar
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 underline">
              Eliminar
            </button>
            <button onClick={() => router.push("/coach")}
              className="text-xs text-slate-300 hover:text-slate-100 underline">
              Volver
            </button>
          </div>
        </div>

        {/* Código que se comparte con atletas para que puedan unirse al grupo. */}
        {group.joinCode && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Código de invitación</p>
              <p className="text-lg font-mono font-semibold text-sky-300">{group.joinCode}</p>
            </div>
            <p className="text-xs text-slate-500">Comparte este código con tus atletas para que se unan</p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Calendario principal. Ocupa más espacio porque es el elemento central de la pantalla. */}
          <div className="lg:col-span-2 space-y-4">

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
                  const daySessions = sessionsByDate[key] ?? [];
                  const hasSession  = daySessions.length > 0;
                  const isSelected  = selectedDate === key;
                  const isToday     = key === todayKey;

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
                        isToday ? "bg-sky-500 text-white font-bold"
                          : isSelected ? "text-sky-300"
                          : hasSession ? "text-slate-100"
                          : "text-slate-500",
                      ].join(" ")}>{day}</span>

                      {/* Indicadores visuales de sesiones. Como máximo se muestran tres puntos y luego un contador. */}
                      {hasSession && (
                        <div className="flex gap-0.5 mt-0.5 justify-center">
                          {daySessions.slice(0, 3).map((_, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${SESSION_DOT}`} />
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
            </div>

            {/* Panel con las sesiones del día seleccionado en el calendario. */}
            {selectedDate && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300">
                    {(() => {
                      const [y, m, d] = selectedDate.split("-").map(Number);
                      return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
                    })()}
                  </h3>
                  {selectedDate === todayKey && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-900/40 border border-sky-700/40 text-sky-300">Hoy</span>
                  )}
                </div>

                {selectedSessions.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin sesiones.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSessions.map(s => (
                      <div key={s.id}
                        className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SESSION_DOT}`} />
                          <p className="font-semibold text-slate-100">{s.title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button onClick={() => router.push(`/coach/sessions/${s.id}/preview`)}
                            className="text-[10px] text-slate-400 hover:text-slate-200">Ver</button>
                          <button onClick={() => router.push(`/coach/sessions/${s.id}`)}
                            className="text-[10px] text-sky-400 hover:text-sky-300">Editar</button>
                          <button onClick={() => handleDeleteSession(s.id)} disabled={deletingId === s.id}
                            className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-40">
                            {deletingId === s.id ? "..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna lateral con resumen del grupo y lista de atletas. */}
          <div className="space-y-5">

            {/* Resumen rápido del grupo. */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resumen</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Sesiones", value: allSessions.length },
                  { label: "Atletas",  value: members.length },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-950/40 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-50">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de miembros del grupo con acceso al perfil de cada atleta. */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Miembros ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="text-xs text-slate-400">Sin atletas todavía.</p>
              ) : (
                <div className="space-y-1">
                  {members.map(m => (
                    <a key={m.id} href={`/coach/athletes/${m.athleteUserId}`}
                      className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/40 hover:border-sky-500/50 transition text-xs">
                      <p className="font-semibold text-slate-50">{m.athleteName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.active ? "bg-emerald-900/40 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                        {m.active ? "Activo" : "Inactivo"}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modal de confirmación antes de borrar el grupo completo. */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm mx-4 space-y-3">
            <p className="text-sm font-semibold text-slate-50">¿Eliminar este grupo?</p>
            <p className="text-xs text-slate-400">
              Se eliminará &quot;{group.name}&quot; permanentemente. Los atletas perderán acceso a las sesiones.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
              <button onClick={handleDeleteGroup} disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
