"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getWellnessForDate, WellnessEntryDto } from "@/lib/wellness";
import { getAthleteTodaySessions, TrainingSessionDto } from "@/lib/trainingSessions";
import { getAthleteGroups } from "@/lib/groupMembers";
import { getGroup, GroupDto } from "@/lib/groups";
import CycleBlock from "@/components/CycleBlock";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface PersonalSessionDto {
  id: number;
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}

export default function AthleteHomePage() {
  const router = useRouter();
  const { user, loading: userLoading, setUser } = useCurrentUser();

  const [today] = useState(() => formatDate(new Date()));
  const [wellness,         setWellness]         = useState<WellnessEntryDto | null>(null);
  const [sessions,         setSessions]         = useState<TrainingSessionDto[]>([]);
  const [personalSessions, setPersonalSessions] = useState<PersonalSessionDto[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [group,            setGroup]            = useState<GroupDto | null>(null);
  const [logoutLoading,    setLogoutLoading]    = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  // Modal nueva sesión personal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<{
    title: string; type: "TRAINING" | "COMPETITION"; notes: string;
  }>({ title: "", type: "TRAINING", notes: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [newError,  setNewError]  = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    if (user.role === "COACH") router.replace("/coach");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== "ATHLETE") { setLoading(false); return; }
    const athleteId = user.athleteProfileId;
    if (!athleteId) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      setError(null);
      let hasTechnicalError = false;
      let wellnessData: WellnessEntryDto | null = null;
      let sessionsData: TrainingSessionDto[] = [];
      let personalData: PersonalSessionDto[] = [];

      try { wellnessData = await getWellnessForDate(athleteId!, today); }
      catch { hasTechnicalError = true; }

      try { sessionsData = await getAthleteTodaySessions(athleteId!); }
      catch { hasTechnicalError = true; }

      try {
        const res = await fetch(
          `${API_BASE_URL}/personal-sessions/athlete/${athleteId}`,
          { cache: "no-store", credentials: "include" }
        );
        if (res.ok) {
          const all: PersonalSessionDto[] = await res.json();
          personalData = all.filter((p) => p.date === today);
        }
      } catch { /* no bloqueamos */ }

      let groupData: GroupDto | null = null;
      try {
        const memberships = await getAthleteGroups(athleteId!);
        const active = memberships.filter((m) => m.active);
        if (active.length > 0 && active[0].groupId) {
          groupData = await getGroup(active[0].groupId);
        }
      } catch { /* no bloqueamos */ }

      setWellness(wellnessData);
      setSessions(sessionsData);
      setPersonalSessions(personalData);
      setGroup(groupData);
      if (hasTechnicalError) setError("No se han podido cargar algunos datos del día.");
      setLoading(false);
    }

    void load();
  }, [user, userLoading, today]);

  async function handleCreatePersonal() {
    if (!user?.athleteProfileId || !newForm.title.trim()) {
      setNewError("El título es obligatorio.");
      return;
    }
    setSavingNew(true);
    setNewError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/personal-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          athleteId: user.athleteProfileId,
          date: today,
          title: newForm.title.trim(),
          type: newForm.type,
          notes: newForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      const created: PersonalSessionDto = await res.json();
      setPersonalSessions((prev) => [...prev, created]);
      setShowNewModal(false);
      setNewForm({ title: "", type: "TRAINING", notes: "" });
    } catch {
      setNewError("No se pudo guardar la sesión.");
    } finally {
      setSavingNew(false);
    }
  }

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignorar */ } finally {
      setUser(null);
      router.push("/login");
      setLogoutLoading(false);
    }
  };

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando sesión...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <div className="text-center space-y-2">
        <p className="text-sm text-slate-200">No has iniciado sesión.</p>
        <Link href="/login" className="text-xs text-sky-300 hover:text-sky-200 underline">
          Ir a la pantalla de login →
        </Link>
      </div>
    </div>
  );

  if (user.role === "COACH") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Redirigiendo al panel de entrenador...</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando tu día de entrenamiento...</p>
    </div>
  );

  const totalHoy = sessions.length + personalSessions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Hola, {user.fullName}</h1>
            <p className="text-xs text-slate-400">Resumen de tu día · {today.split("-").reverse().join(".")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/athlete/settings"
              className="text-[11px] px-3 py-1 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800">
              Ajustes
            </Link>
            <button onClick={handleLogout} disabled={logoutLoading}
              className="text-[11px] text-slate-400 hover:text-slate-100 underline disabled:opacity-60">
              {logoutLoading ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </header>

        {error && (
          <p className="text-sm text-amber-200 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {user.athleteProfileId && (
          <CycleBlock athleteId={user.athleteProfileId} />
        )}

        {/* Wellness */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Wellness de hoy</h2>
              <p className="text-[11px] text-slate-400">Cómo llegas al entrenamiento</p>
            </div>
            <Link href="/athlete/wellness" className="text-[11px] text-sky-300 hover:text-sky-200">
              Completar / editar →
            </Link>
          </div>

          {wellness ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-slate-400 uppercase mb-1">Fatiga</p>
                <p className="font-semibold text-slate-50">
                  {wellness.fatigue ?? "-"}<span className="text-[11px] text-slate-400"> /10</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase mb-1">Dolor muscular</p>
                <p className="font-semibold text-slate-50">
                  {wellness.soreness ?? "-"}<span className="text-[11px] text-slate-400"> /10</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase mb-1">Estrés</p>
                <p className="font-semibold text-slate-50">
                  {wellness.stress ?? "-"}<span className="text-[11px] text-slate-400"> /10</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase mb-1">Comentario</p>
                <p className="text-[11px] text-slate-200">{wellness.comment || "Sin comentario"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aún no has rellenado tu wellness de hoy.</p>
          )}

          <Link href="/athlete/wellness/history"
            className="text-[11px] text-slate-400 hover:text-slate-200 underline">
            Ver historial de wellness →
          </Link>
        </section>

        {/* Sesiones de hoy */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Sesiones de hoy</h2>
              <p className="text-[11px] text-slate-400">Lo que tienes planificado</p>
            </div>
            <Link href="/athlete/sessions" className="text-[11px] text-sky-300 hover:text-sky-200">
              Ver calendario →
            </Link>
          </div>

          {totalHoy === 0 ? (
            <p className="text-sm text-slate-400">Hoy no tienes sesiones asignadas.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id}
                  className="border border-slate-800 rounded-xl px-3 py-2.5 flex items-center justify-between text-sm bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                    <p className="font-semibold text-slate-50">{session.title}</p>
                  </div>
                  <Link href={`/athlete/sessions/${session.id}/result`}
                    className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 flex-shrink-0 ml-3">
                    Registrar resultado →
                  </Link>
                </div>
              ))}

              {personalSessions.map((p) => (
                <div key={p.id}
                  className="border border-slate-800 rounded-xl px-3 py-2.5 flex items-center justify-between text-sm bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      p.type === "COMPETITION" ? "bg-violet-500" : "bg-amber-400"
                    }`} />
                    <div>
                      <p className="font-semibold text-slate-50">{p.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.type === "COMPETITION" ? "Competición" : "Entrenamiento propio"}
                      </p>
                    </div>
                  </div>
                  {p.notes && (
                    <p className="text-[10px] text-slate-500 italic ml-3 text-right max-w-[40%]">{p.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botón añadir sesión propia */}
          <button
            type="button"
            onClick={() => { setNewForm({ title: "", type: "TRAINING", notes: "" }); setNewError(null); setShowNewModal(true); }}
            className="w-full border border-dashed border-slate-700 hover:border-slate-500 rounded-xl py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            + Añadir sesión propia hoy
          </button>
        </section>

        {/* Grupo */}
        <section className="bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Tu grupo de entrenamiento</h2>
              {group ? (
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Perteneces a <span className="font-semibold">{group.name}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Cuando tu entrenador cree un grupo, podrás unirte aquí.
                </p>
              )}
            </div>
            {group ? (
              <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/50 text-emerald-300">
                ✓ Miembro
              </span>
            ) : (
              <Link href="/athlete/join-group"
                className="text-[11px] px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                Unirme a un grupo
              </Link>
            )}
          </div>
        </section>

      </div>

      {/* Modal nueva sesión personal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-base font-semibold text-slate-50">Nueva sesión propia</h2>
              <p className="text-xs text-slate-400 mt-0.5">{today.split("-").reverse().join(".")}</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Título *</label>
              <input
                type="text"
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Cross, Gym, Competición..."
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Tipo</label>
              <div className="flex gap-2">
                {(["TRAINING", "COMPETITION"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setNewForm((f) => ({ ...f, type: t }))}
                    className={[
                      "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      newForm.type === t
                        ? t === "COMPETITION"
                          ? "bg-violet-500/20 border-violet-400 text-violet-300"
                          : "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "border-slate-700 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {t === "COMPETITION" ? "Competición" : "Entrenamiento"}
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
                placeholder="60m — 7.45, sensaciones..."
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