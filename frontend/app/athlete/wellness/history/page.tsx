"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWellnessHistory, WellnessEntryDto } from "@/lib/wellness";
import { useCurrentUser } from "@/components/CurrentUserProvider";

export default function WellnessHistoryPage() {
  const { user, loading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WellnessEntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Wellness · Factoría Core
            </p>
            <h1 className="text-2xl font-semibold">Historial de wellness</h1>
            <p className="text-[11px] text-slate-400">
              Cómo has ido llegando a los entrenamientos
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

        {entries.length === 0 && !error && (
          <p className="text-sm text-slate-300">No hay registros todavía.</p>
        )}

        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id ?? `${e.date}-${e.comment ?? "entry"}`}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow p-4 space-y-2"
            >
              <h3 className="text-sm font-semibold text-slate-50">{e.date}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                <p>
                  <span className="text-slate-400">Sueño:</span>{" "}
                  {e.sleepHours ?? "-"} h
                </p>
                <p>
                  <span className="text-slate-400">Fatiga:</span>{" "}
                  {e.fatigue ?? "-"}
                </p>
                <p>
                  <span className="text-slate-400">Dolor:</span>{" "}
                  {e.soreness ?? "-"}
                </p>
                <p>
                  <span className="text-slate-400">Estrés:</span>{" "}
                  {e.stress ?? "-"}
                </p>
                <p>
                  <span className="text-slate-400">Ánimo:</span>{" "}
                  {e.mood ?? "-"}
                </p>
              </div>

              {e.comment && (
                <p className="text-[11px] text-slate-300 italic">
                  “{e.comment}”
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}