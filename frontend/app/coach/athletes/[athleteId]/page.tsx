"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAthletes, UserDto } from "@/lib/users";
import { getAthleteProfile } from "@/lib/athleteProfile";
import { getWellnessHistory, WellnessEntryDto } from "@/lib/wellness";
import {
  getResultsByAthlete,
  SessionResultDto,
} from "@/lib/sessionResults";
import {
  getAthleteSessions,
  TrainingSessionDto,
} from "@/lib/trainingSessions";

export default function CoachAthleteDetailPage() {
  const params = useParams();
  const router = useRouter();
  // athleteId de la URL es User.id (viene del link del group dashboard)
  const userId = Number(params.athleteId);

  const [athlete, setAthlete] = useState<UserDto | null>(null);
  const [wellness, setWellness] = useState<WellnessEntryDto[]>([]);
  const [results, setResults] = useState<SessionResultDto[]>([]);
  const [sessions, setSessions] = useState<TrainingSessionDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionById = useMemo(() => {
    const map = new Map<number, TrainingSessionDto>();
    for (const s of sessions) {
      map.set(s.id, s);
    }
    return map;
  }, [sessions]);

  useEffect(() => {
    if (Number.isNaN(userId)) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Primero obtenemos el perfil de atleta para conseguir el AthleteProfile.id
        const [athletesList, profile] = await Promise.all([
          getAthletes(),
          getAthleteProfile(userId),
        ]);

        const found = athletesList.find((a) => a.id === userId) ?? null;
        setAthlete(found);

        if (!profile?.id) {
          // El usuario existe pero aún no tiene perfil de atleta creado
          setLoading(false);
          return;
        }

        // Ahora usamos el AthleteProfile.id correcto para las demás llamadas
        const athleteProfileId = profile.id;

        const [wellnessHistory, resByAthlete, athleteSess] = await Promise.all([
          getWellnessHistory(athleteProfileId),
          getResultsByAthlete(athleteProfileId),
          getAthleteSessions(athleteProfileId),
        ]);

        const sortedWellness = [...wellnessHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWellness(sortedWellness);

        const sortedResults = [...resByAthlete].sort(
          (a, b) => (b.id ?? 0) - (a.id ?? 0)
        );
        setResults(sortedResults);

        setSessions(athleteSess);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar la información del atleta.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando atleta...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="space-y-2 text-center">
          <p className="text-sm text-slate-200">Atleta no encontrado.</p>
          <button
            onClick={() => router.push("/coach")}
            className="text-xs text-sky-300 hover:text-sky-200 underline"
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Atleta
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold">
              {athlete.fullName}
            </h1>
            <p className="text-xs text-slate-400">{athlete.email}</p>
          </div>

          <button
            onClick={() => router.back()}
            className="text-xs text-slate-300 hover:text-slate-100 underline"
          >
            ← Volver
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* WELLNESS reciente */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Wellness reciente
          </h2>

          {wellness.length === 0 ? (
            <p className="text-xs text-slate-400">
              No hay registros de wellness.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {wellness.slice(0, 10).map((w) => (
                <div
                  key={w.id}
                  className="border border-slate-800 rounded-xl px-3 py-2 flex justify-between bg-slate-950/40"
                >
                  <div>
                    <p className="font-semibold text-slate-50">{w.date}</p>
                    {w.comment && (
                      <p className="text-[11px] text-slate-300 italic">
                        {w.comment}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-right space-y-1 text-slate-200">
                    <p>Sueño: {w.sleepHours ?? "-"} h</p>
                    <p>Fatiga: {w.fatigue ?? "-"}</p>
                    <p>Dolor: {w.soreness ?? "-"}</p>
                    <p>Estrés: {w.stress ?? "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RENDIMIENTO */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Historial de rendimiento
          </h2>

          {results.length === 0 ? (
            <p className="text-xs text-slate-400">
              No hay resultados registrados.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {results.slice(0, 20).map((r) => {
                const session = r.sessionId
                  ? sessionById.get(r.sessionId)
                  : undefined;

                return (
                  <div
                    key={r.id}
                    className="border border-slate-800 rounded-xl px-3 py-2 space-y-1 bg-slate-950/40"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-50">
                          {session?.title ?? `Sesión #${r.sessionId ?? "?"}`}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Fecha: {session?.date ?? "-"}
                        </p>
                      </div>
                      <div className="text-[11px] text-right text-slate-200">
                        <p>RPE: {r.rpe ?? "-"}</p>
                        <p>Tiempo: {r.timeMain ?? "-"}</p>
                      </div>
                    </div>

                    {r.comment && (
                      <p className="text-[11px] text-slate-300">{r.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}