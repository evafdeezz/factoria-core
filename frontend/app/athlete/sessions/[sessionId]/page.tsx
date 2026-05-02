"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getBlocksBySession, SessionBlockDto } from "@/lib/sessionBlocks";
import { getSessionVideos, SessionVideoDto } from "@/lib/sessionVideos";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Calentamiento",
  TECHNIQUE: "Técnica",
  STRENGTH: "Fuerza",
  PLYOMETRICS: "Pliometría",
  MAIN_SET: "Series principales",
  GYM: "Gimnasio",
  COOLDOWN: "Vuelta a la calma",
  OTHER: "Otro",
};

const TARGET_LABELS: Record<string, string> = {
  ALL: "Todos",
  VELOCISTA: "Velocistas",
  VELOCISTA_CORTO: "Velocistas corto",
  VELOCISTA_LARGO: "Velocistas largo",
  VALLISTA: "Vallistas",
  VALLISTA_CORTO: "Vallistas corto",
  VALLISTA_LARGO: "Vallistas largo",
  SALTADOR: "Saltadores",
};

const BLOCK_TYPE_COLORS: Record<string, string> = {
  WARMUP: "border-amber-500/40 bg-amber-500/5",
  TECHNIQUE: "border-sky-500/40 bg-sky-500/5",
  STRENGTH: "border-red-500/40 bg-red-500/5",
  PLYOMETRICS: "border-purple-500/40 bg-purple-500/5",
  MAIN_SET: "border-green-500/40 bg-green-500/5",
  GYM: "border-orange-500/40 bg-orange-500/5",
  COOLDOWN: "border-teal-500/40 bg-teal-500/5",
  OTHER: "border-slate-500/40 bg-slate-500/5",
};

function SessionDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const sessionId = Number(params.sessionId);

  const returnYear  = searchParams.get("returnYear");
  const returnMonth = searchParams.get("returnMonth");
  const backHref = returnYear && returnMonth
    ? `/athlete/sessions?year=${returnYear}&month=${returnMonth}`
    : "/athlete/sessions";

  const [blocks, setBlocks] = useState<SessionBlockDto[]>([]);
  const [videos, setVideos] = useState<SessionVideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(sessionId)) return;

    async function load() {
      try {
        setLoading(true);
        const [data, vids] = await Promise.all([
          getBlocksBySession(sessionId),
          user?.athleteProfileId ? getSessionVideos(sessionId, user.athleteProfileId) : Promise.resolve([]),
        ]);
        setBlocks(data);
        setVideos(vids);
      } catch (err) {
        console.error(err);
        setError("No se han podido cargar los bloques de la sesión.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">No has iniciado sesión.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando entrenamiento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Detalle de sesión
            </p>
            <h1 className="text-2xl font-semibold">Sesión #{sessionId}</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/athlete/sessions/${sessionId}/result`}
              className="text-xs bg-sky-600 text-white px-4 py-2 rounded-full hover:bg-sky-700 font-semibold"
            >
              Registrar resultado
            </Link>
            <Link
              href={backHref}
              className="text-xs text-slate-300 hover:text-slate-100 underline"
            >
              ← Volver al calendario
            </Link>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {blocks.length === 0 && !error && (
          <p className="text-sm text-slate-300">
            Esta sesión no tiene bloques de entrenamiento.
          </p>
        )}

        {/* Vídeos */}
        {videos.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vídeos</p>
            {videos.map((v) => (
              <div key={v.id} className="space-y-1.5">
                <video
                  src={v.url}
                  controls
                  className="w-full rounded-xl border border-slate-700 bg-black"
                />
                {(v.type || v.notes) && (
                  <div className="flex gap-2 text-[11px] text-slate-400">
                    {v.type  && <span className="bg-slate-800 px-1.5 py-0.5 rounded">{v.type}</span>}
                    {v.notes && <span className="italic">{v.notes}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`border rounded-2xl p-4 space-y-2 ${
                BLOCK_TYPE_COLORS[block.blockType] ||
                "border-slate-700 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                    {BLOCK_TYPE_LABELS[block.blockType] || block.blockType}
                  </span>
                  {block.target !== "ALL" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {TARGET_LABELS[block.target] || block.target}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  Bloque {block.blockOrder}
                </span>
              </div>

              {block.title && (
                <p className="text-sm font-semibold text-slate-100">
                  {block.title}
                </p>
              )}

              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {block.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando...</p>
      </div>
    }>
      <SessionDetailInner />
    </Suspense>
  );
}