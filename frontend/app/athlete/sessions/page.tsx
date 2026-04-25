"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAthleteSessions,
  TrainingSessionDto,
} from "@/lib/trainingSessions";
import { useCurrentUser } from "@/components/CurrentUserProvider";

type GroupedSessions = Record<string, TrainingSessionDto[]>;

export default function AthleteSessionsPage() {
  const { user } = useCurrentUser();

  const [sessions, setSessions] = useState<TrainingSessionDto[]>([]);
  const [grouped, setGrouped] = useState<GroupedSessions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const byDate: GroupedSessions = {};
        for (const s of sorted) {
          const key = s.date;
          if (!byDate[key]) byDate[key] = [];
          byDate[key].push(s);
        }
        setGrouped(byDate);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el historial de sesiones.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [athleteId]);

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

  if (!user.athleteProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Aún no tienes perfil de atleta. Completa tu configuración en Ajustes.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">
          Cargando historial de sesiones...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Sesiones · Factoría Core
            </p>
            <h1 className="text-2xl font-semibold">Historial de sesiones</h1>
          </div>
          <Link
            href="/athlete"
            className="text-xs text-slate-300 hover:text-slate-100 underline"
          >
            Volver al día
          </Link>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {sessions.length === 0 && !error && (
          <p className="text-sm text-slate-300">
            Todavía no tienes sesiones registradas.
          </p>
        )}

        <div className="space-y-4">
          {Object.entries(grouped).map(([date, sessionsForDate]) => (
            <div
              key={date}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-3"
            >
              <h2 className="text-xs font-semibold text-slate-300 mb-2">
                {date}
              </h2>

              <div className="space-y-2">
                {sessionsForDate.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-50">
                        {session.title}
                      </p>
                      {session.status && (
                        <p className="text-[11px] text-slate-400">
                          Estado: {session.status}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/athlete/sessions/${session.id}`}
                      className="text-[11px] font-medium text-sky-300 hover:text-sky-200"
                    >
                      Ver entrenamiento →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}