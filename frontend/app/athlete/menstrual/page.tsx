"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getCycleHistory, MenstrualCycleDto } from "@/lib/menstrualCycle";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function MenstrualHistoryPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [cycles, setCycles] = useState<MenstrualCycleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.athleteProfileId) { setLoading(false); return; }
    getCycleHistory(user.athleteProfileId)
      .then(setCycles)
      .catch(() => setError("No se ha podido cargar el historial."))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900">
      <p className="text-sm text-slate-300">Cargando historial...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-5">
        <button type="button" onClick={() => router.push("/athlete")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver al panel
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Ciclo menstrual</p>
          <h1 className="text-2xl font-semibold">Historial de ciclos</h1>
          <p className="text-xs text-slate-400">
            Toca un ciclo para ver o editar el diario de síntomas de esos días.
          </p>
        </header>

        {error && (
          <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {cycles.length === 0 && !error && (
          <p className="text-sm text-slate-400">
            Aún no hay ciclos registrados. Cuando registres tu primer período aparecerá aquí.
          </p>
        )}

        <div className="space-y-3">
          {cycles.map((cycle, i) => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => router.push(`/athlete/menstrual/${cycle.id}`)}
              className="w-full text-left bg-slate-900/60 border border-slate-800 hover:border-sky-700 rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-sky-300 uppercase tracking-wider font-medium mb-0.5">
                    {i === 0 ? "Ciclo actual" : `Ciclo ${cycles.length - i}`}
                  </p>
                  <p className="text-sm font-semibold text-slate-100">
                    Inicio: {formatDate(cycle.startDate)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {cycle.cycleLength ? `${cycle.cycleLength} días de ciclo` : "Duración no registrada"}
                    {cycle.bleedingDays ? ` · ${cycle.bleedingDays} días de menstruación` : ""}
                  </p>
                </div>
                <span className="text-sky-400 text-lg ml-3">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}