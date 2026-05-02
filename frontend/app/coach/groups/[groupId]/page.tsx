"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroup, GroupDto, deleteGroup } from "@/lib/groups";
import { getGroupMembersDetailed, GroupMemberDetailDto } from "@/lib/groupMembers";
import { getGroupTodaySessions, TrainingSessionDto } from "@/lib/trainingSessions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const SESSION_DOT = "bg-sky-400";

export default function GroupDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.groupId);

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [members, setMembers] = useState<GroupMemberDetailDto[]>([]);
  const [sessionsToday, setSessionsToday] = useState<TrainingSessionDto[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSessionDto[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (Number.isNaN(groupId)) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [g, mem, sess, allRes] = await Promise.all([
          getGroup(groupId),
          getGroupMembersDetailed(groupId),
          getGroupTodaySessions(groupId),
          fetch(`${API_BASE_URL}/sessions/group/${groupId}`, { cache: "no-store", credentials: "include" })
            .then((r) => r.ok ? r.json() : []),
        ]);
        setGroup(g);
        setMembers(mem);
        setSessionsToday(sess);
        const sorted = [...(allRes as TrainingSessionDto[])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAllSessions(sorted);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el grupo.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [groupId]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteGroup(groupId);
      router.push("/coach");
    } catch (err) {
      console.error(err);
      setError("No se ha podido eliminar el grupo.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
    try {
      setDeletingId(sessionId);
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setAllSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSessionsToday((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError("No se ha podido eliminar la sesión.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando grupo...</p>
    </div>
  );

  if (!group) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-200">Grupo no encontrado.</p>
        <button onClick={() => router.push("/coach")}
          className="text-xs text-sky-300 hover:text-sky-200 underline">
          Volver al panel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Grupo</p>
            <h1 className="text-2xl md:text-3xl font-semibold">{group.name}</h1>
            <p className="text-xs text-slate-400">
              {group.competitionCategory ?? "Sin categoría"} · {group.discipline ?? "Sin disciplina"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/coach/groups/${groupId}/edit`)}
              className="text-xs text-sky-300 hover:text-sky-200 underline">
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 underline">
              Eliminar
            </button>
            <button onClick={() => router.push("/coach")}
              className="text-xs text-slate-300 hover:text-slate-100 underline">
              Volver
            </button>
          </div>
        </div>

        {/* Código de invitación */}
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

        {/* Sesiones de hoy */}
        {sessionsToday.length > 0 && (
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">📅 Hoy</h2>
            <div className="space-y-2">
              {sessionsToday.map((s) => {
                return (
                  <div key={s.id} className="border border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SESSION_DOT}`} />
                      <div>
                        <p className="font-semibold text-slate-50">{s.title}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSession(s.id)} disabled={deletingId === s.id}
                      className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-40 ml-2">
                      {deletingId === s.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historial de sesiones */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">
              Historial de sesiones ({allSessions.length})
            </h2>
            <button
              onClick={() => router.push(`/coach/groups/${groupId}/new-session`)}
              className="text-xs bg-sky-600 text-white px-3 py-1.5 rounded-full hover:bg-sky-700 font-semibold">
              + Nueva sesión
            </button>
          </div>

          {allSessions.length === 0 ? (
            <p className="text-xs text-slate-400">No hay sesiones creadas para este grupo.</p>
          ) : (() => {
            // Group by month
            const byMonth: Record<string, TrainingSessionDto[]> = {};
            for (const s of allSessions) {
              const [y, m] = s.date.split("-");
              const key = `${y}-${m}`;
              if (!byMonth[key]) byMonth[key] = [];
              byMonth[key].push(s);
            }
            return (
              <div className="space-y-4">
                {Object.entries(byMonth).map(([key, sessions]) => {
                  const [y, m] = key.split("-");
                  return (
                    <div key={key}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        {MONTHS_ES[parseInt(m) - 1]} {y}
                      </p>
                      <div className="space-y-1.5">
                        {sessions.map((s) => {
                          const [, , dd] = s.date.split("-");
                          return (
                            <div key={s.id}
                              className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-950/40 hover:border-slate-700 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="text-slate-500 w-6 text-right flex-shrink-0">{dd}</span>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SESSION_DOT}`} />
                                <div>
                                  <p className="font-semibold text-slate-100">{s.title}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                                <button type="button"
                                  onClick={() => router.push(`/coach/sessions/${s.id}/preview`)}
                                  className="text-[10px] text-slate-400 hover:text-slate-200">
                                  Ver
                                </button>
                                <button type="button"
                                  onClick={() => router.push(`/coach/sessions/${s.id}`)}
                                  className="text-[10px] text-sky-400 hover:text-sky-300">
                                  Editar
                                </button>
                                <button onClick={() => handleDeleteSession(s.id)} disabled={deletingId === s.id}
                                  className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-40">
                                  {deletingId === s.id ? "..." : "Eliminar"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Miembros */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-50">
            Miembros del grupo ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="text-xs text-slate-400">No hay atletas asignados a este grupo.</p>
          ) : (
            <div className="space-y-1 text-xs">
              {members.map((m) => (
                <a
                  href={`/coach/athletes/${m.athleteUserId}`}
                  key={m.id}
                  className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/40 hover:border-sky-500 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-50">{m.athleteName}</p>
                    {m.joinedAt && (
                      <p className="text-[11px] text-slate-400">Desde: {m.joinedAt.slice(0, 10)}</p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                    {m.active ? "Activo" : "Inactivo"}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm mx-4 space-y-3">
            <p className="text-sm font-semibold text-slate-50">¿Eliminar este grupo?</p>
            <p className="text-xs text-slate-400">
              Se eliminará &quot;{group.name}&quot; permanentemente. Los atletas perderán acceso a las sesiones de este grupo.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}