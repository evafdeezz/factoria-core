"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getBlocksBySession, SessionBlockDto } from "@/lib/sessionBlocks";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Calentamiento", TECHNIQUE: "Técnica", STRENGTH: "Fuerza",
  PLYOMETRICS: "Pliometría", MAIN_SET: "Series principales",
  GYM: "Gimnasio", COOLDOWN: "Vuelta a la calma", OTHER: "Otro",
};

const TARGET_LABELS: Record<string, string> = {
  ALL: "Todos", VELOCISTA: "Velocistas", VELOCISTA_CORTO: "Velocistas corto",
  VELOCISTA_LARGO: "Velocistas largo", VALLISTA: "Vallistas",
  VALLISTA_CORTO: "Vallistas corto", VALLISTA_LARGO: "Vallistas largo",
  SALTADOR: "Saltadores",
};

const BLOCK_TYPE_COLORS: Record<string, string> = {
  WARMUP:      "border-amber-500/40 bg-amber-500/5",
  TECHNIQUE:   "border-sky-500/40 bg-sky-500/5",
  STRENGTH:    "border-red-500/40 bg-red-500/5",
  PLYOMETRICS: "border-purple-500/40 bg-purple-500/5",
  MAIN_SET:    "border-green-500/40 bg-green-500/5",
  GYM:         "border-orange-500/40 bg-orange-500/5",
  COOLDOWN:    "border-teal-500/40 bg-teal-500/5",
  OTHER:       "border-slate-500/40 bg-slate-500/5",
};

const BLOCK_ACCENTS: Record<string, string> = {
  WARMUP: "text-amber-400", TECHNIQUE: "text-sky-400", STRENGTH: "text-red-400",
  PLYOMETRICS: "text-purple-400", MAIN_SET: "text-green-400",
  GYM: "text-orange-400", COOLDOWN: "text-teal-400", OTHER: "text-slate-400",
};

interface SessionHeader {
  title: string;
  date: string;
  startTime?: string | null;
  description?: string | null;
  groupId?: number;
}

export default function CoachSessionPreviewPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user } = useCurrentUser();
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionHeader | null>(null);
  const [blocks,  setBlocks]  = useState<SessionBlockDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(sessionId)) return;
    async function load() {
      try {
        setLoading(true);
        const [sessRes, blocksData] = await Promise.all([
          fetch(`${API_BASE_URL}/sessions/${sessionId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
          getBlocksBySession(sessionId),
        ]);
        if (sessRes) setSession(sessRes);
        setBlocks(blocksData);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar la sesión.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sessionId]);

  if (!user || user.role !== "COACH") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Solo entrenadores.</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando sesión...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Vista previa</p>
            <h1 className="text-2xl font-semibold">{session?.title ?? `Sesión #${sessionId}`}</h1>
            {session?.date && (
              <p className="text-xs text-slate-400 mt-0.5">
                {session.date.split("-").reverse().join(".")}{session.startTime ? ` · ${session.startTime}` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => router.push(`/coach/sessions/${sessionId}`)}
              className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-full font-semibold transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => router.push(session?.groupId ? `/coach/groups/${session.groupId}` : "/coach")}
              className="text-xs text-slate-300 hover:text-slate-100 underline"
            >
              ← Volver
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
        )}

        {session?.description && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{session.description}</p>
          </div>
        )}

        {blocks.length === 0 && !error && (
          <p className="text-sm text-slate-400">Esta sesión no tiene bloques todavía.</p>
        )}

        <div className="space-y-3">
          {blocks.map((block) => (
            <div key={block.id}
              className={`border rounded-2xl p-4 space-y-2 ${BLOCK_TYPE_COLORS[block.blockType] ?? "border-slate-700 bg-slate-900/60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${BLOCK_ACCENTS[block.blockType] ?? "text-slate-400"}`}>
                    {BLOCK_TYPE_LABELS[block.blockType] ?? block.blockType}
                  </span>
                  {block.target !== "ALL" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {TARGET_LABELS[block.target] ?? block.target}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">Bloque {block.blockOrder}</span>
              </div>

              {block.title && (
                <p className="text-sm font-semibold text-slate-100">{block.title}</p>
              )}
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {block.description}
              </p>
            </div>
          ))}
        </div>

        { }
        <p className="text-[10px] text-slate-600 text-center pt-2">
          Así ven los atletas esta sesión · Los resultados los registran ellos desde su panel
        </p>
      </div>
    </div>
  );
}