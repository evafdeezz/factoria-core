"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlocksBySession, SessionBlockDto } from "@/lib/sessionBlocks";
import { getSessionResult, saveSessionResult } from "@/lib/sessionResults";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import {
  getSessionVideos, saveSessionVideo, deleteSessionVideo, SessionVideoDto,
} from "@/lib/sessionVideos";

// ─── Block type classification ───────────────────────────────────────────────

type BlockMode = "time_series" | "weight_sets" | "notes" | "skip";

function getBlockMode(blockType: string): BlockMode {
  switch (blockType) {
    case "MAIN_SET":                  return "time_series";
    case "STRENGTH":
    case "GYM":
    case "PLYOMETRICS":               return "weight_sets";
    case "TECHNIQUE":
    case "OTHER":                     return "notes";
    case "WARMUP":
    case "COOLDOWN":                  return "skip";
    default:                          return "notes";
  }
}

/** Try to extract rep count from a description like "4x400m", "3×30m" */
function parseSeriesCount(description: string): number {
  const m = description.match(/(\d+)\s*[xX×]/);
  if (m) return Math.min(Math.max(parseInt(m[1]), 1), 12);
  return 3;
}

// ─── Result state types ───────────────────────────────────────────────────────

interface TimeEntry  { value: string }
interface SetEntry   { reps: string; weight: string }

type BlockResult =
  | { mode: "time_series"; times: TimeEntry[] }
  | { mode: "weight_sets"; sets: SetEntry[] }
  | { mode: "notes";       text: string }
  | { mode: "skip" };

type BlockResultsMap = Record<number, BlockResult>; // keyed by block.id

// ─── Serialization ────────────────────────────────────────────────────────────

interface SavedPayload {
  version: 2;
  blocks: Array<{ blockId: number } & BlockResult>;
}

function serialize(map: BlockResultsMap): string {
  const blocks = Object.entries(map)
    .map(([id, result]) => ({ blockId: parseInt(id), ...result }));
  const payload: SavedPayload = { version: 2, blocks };
  return JSON.stringify(payload);
}

function deserialize(raw: string | null | undefined, blocks: SessionBlockDto[]): BlockResultsMap {
  if (!raw) return buildInitialMap(blocks);
  try {
    const parsed = JSON.parse(raw) as SavedPayload;
    if (parsed.version === 2) {
      const map: BlockResultsMap = {};
      for (const b of parsed.blocks) {
        const { blockId, ...result } = b;
        map[blockId] = result as BlockResult;
      }
      return map;
    }
  } catch { /* fall through */ }
  return buildInitialMap(blocks);
}

function buildInitialMap(blocks: SessionBlockDto[]): BlockResultsMap {
  const map: BlockResultsMap = {};
  for (const block of blocks) {
    const mode = getBlockMode(block.blockType);
    if (mode === "skip") {
      map[block.id] = { mode: "skip" };
    } else if (mode === "time_series") {
      const count = parseSeriesCount(block.description ?? "");
      map[block.id] = { mode: "time_series", times: Array(count).fill(null).map(() => ({ value: "" })) };
    } else if (mode === "weight_sets") {
      map[block.id] = { mode: "weight_sets", sets: [{ reps: "", weight: "" }, { reps: "", weight: "" }, { reps: "", weight: "" }] };
    } else {
      map[block.id] = { mode: "notes", text: "" };
    }
  }
  return map;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Calentamiento", TECHNIQUE: "Técnica", STRENGTH: "Fuerza",
  PLYOMETRICS: "Pliometría", MAIN_SET: "Series principales",
  GYM: "Gimnasio", COOLDOWN: "Vuelta a la calma", OTHER: "Otro",
};

const BLOCK_TYPE_COLORS: Record<string, { border: string; accent: string }> = {
  MAIN_SET:    { border: "border-green-500/40",  accent: "text-green-400" },
  STRENGTH:    { border: "border-red-500/40",    accent: "text-red-400" },
  GYM:         { border: "border-orange-500/40", accent: "text-orange-400" },
  PLYOMETRICS: { border: "border-purple-500/40", accent: "text-purple-400" },
  TECHNIQUE:   { border: "border-sky-500/40",    accent: "text-sky-400" },
  OTHER:       { border: "border-slate-500/40",  accent: "text-slate-400" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeSeriesInput({
  blockId, result, onChange,
}: {
  blockId: number;
  result: { mode: "time_series"; times: TimeEntry[] };
  onChange: (id: number, r: BlockResult) => void;
}) {
  const update = (i: number, value: string) => {
    const times = result.times.map((t, idx) => idx === i ? { value } : t);
    onChange(blockId, { ...result, times });
  };
  const addSeries = () =>
    onChange(blockId, { ...result, times: [...result.times, { value: "" }] });
  const removeLast = () => {
    if (result.times.length <= 1) return;
    onChange(blockId, { ...result, times: result.times.slice(0, -1) });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {result.times.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 w-12 flex-shrink-0">
              Serie {i + 1}
            </span>
            <input
              type="text"
              value={t.value}
              onChange={(e) => update(i, e.target.value)}
              placeholder="4.02"
              className="flex-1 min-w-0 border border-slate-700 rounded-lg bg-slate-950/40 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={addSeries}
          className="text-[11px] text-sky-400 hover:text-sky-300"
        >
          + Añadir serie
        </button>
        {result.times.length > 1 && (
          <button
            type="button"
            onClick={removeLast}
            className="text-[11px] text-slate-500 hover:text-slate-400"
          >
            – Quitar última
          </button>
        )}
      </div>
    </div>
  );
}

function WeightSetsInput({
  blockId, result, onChange,
}: {
  blockId: number;
  result: { mode: "weight_sets"; sets: SetEntry[] };
  onChange: (id: number, r: BlockResult) => void;
}) {
  const update = (i: number, field: "reps" | "weight", value: string) => {
    const sets = result.sets.map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s
    );
    onChange(blockId, { ...result, sets });
  };
  const addSet = () =>
    onChange(blockId, { ...result, sets: [...result.sets, { reps: "", weight: "" }] });
  const removeLast = () => {
    if (result.sets.length <= 1) return;
    onChange(blockId, { ...result, sets: result.sets.slice(0, -1) });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-[10px] text-slate-500 uppercase tracking-wider px-0.5">
        <span />
        <span>Reps</span>
        <span>Peso (kg)</span>
      </div>
      {result.sets.map((s, i) => (
        <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 items-center">
          <span className="text-[10px] text-slate-500 text-right">{i + 1}</span>
          <input
            type="text"
            value={s.reps}
            onChange={(e) => update(i, "reps", e.target.value)}
            placeholder="10"
            className="border border-slate-700 rounded-lg bg-slate-950/40 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/60"
          />
          <input
            type="text"
            value={s.weight}
            onChange={(e) => update(i, "weight", e.target.value)}
            placeholder="60"
            className="border border-slate-700 rounded-lg bg-slate-950/40 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/60"
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={addSet}
          className="text-[11px] text-orange-400 hover:text-orange-300"
        >
          + Añadir serie
        </button>
        {result.sets.length > 1 && (
          <button
            type="button"
            onClick={removeLast}
            className="text-[11px] text-slate-500 hover:text-slate-400"
          >
            – Quitar última
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SessionResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();

  const sessionId = Number(params.sessionId);

  const [blocks, setBlocks] = useState<SessionBlockDto[]>([]);
  const [blockResults, setBlockResults] = useState<BlockResultsMap>({});
  const [existingResultId, setExistingResultId] = useState<number | undefined>();

  const [rpe, setRpe] = useState("");
  const [comment, setComment] = useState("");
  const [painFlag, setPainFlag] = useState(false);
  const [painNotes, setPainNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Video state
  const [videos,     setVideos]     = useState<SessionVideoDto[]>([]);
  const [videoUrl,   setVideoUrl]   = useState("");
  const [videoType,  setVideoType]  = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [savingVideo,setSavingVideo] = useState(false);

  const athleteId = user?.athleteProfileId;

  useEffect(() => {
    if (!athleteId || Number.isNaN(sessionId)) { setLoading(false); return; }

    async function load() {
      try {
        setLoading(true);
        const [loadedBlocks, existing, existingVideos] = await Promise.all([
          getBlocksBySession(sessionId),
          getSessionResult(athleteId!, sessionId),
          getSessionVideos(sessionId, athleteId!),
        ]);
        setVideos(existingVideos);

        // Only show blocks that require a result
        const relevant = loadedBlocks.filter(
          (b) => getBlockMode(b.blockType) !== "skip"
        );
        setBlocks(relevant);

        if (existing) {
          setExistingResultId(existing.id);
          setRpe(existing.rpe?.toString() ?? "");
          setComment(existing.comment ?? "");
          setPainFlag(existing.painFlag ?? false);
          setPainNotes(existing.painNotes ?? "");
          setBlockResults(deserialize(existing.timeMain, relevant));
        } else {
          setBlockResults(buildInitialMap(relevant));
        }
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar la sesión.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [athleteId, sessionId]);

  const updateBlock = (id: number, result: BlockResult) => {
    setBlockResults((prev) => ({ ...prev, [id]: result }));
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim() || !user?.athleteProfileId) return;
    setVideoError(null);
    setSavingVideo(true);
    try {
      const saved = await saveSessionVideo({
        sessionId,
        athleteId: user.athleteProfileId,
        url:   videoUrl.trim(),
        type:  videoType  || null,
        notes: videoNotes || null,
      });
      setVideos(prev => [...prev, saved]);
      setVideoUrl("");
      setVideoType("");
      setVideoNotes("");
    } catch {
      setVideoError("No se pudo guardar el enlace.");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (id?: number) => {
    if (!id) return;
    try {
      await deleteSessionVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch {
      setVideoError("No se pudo eliminar el enlace.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.athleteProfileId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveSessionResult({
        sessionId,
        athleteId: user.athleteProfileId,
        timeMain: serialize(blockResults),
        rpe: rpe ? Number(rpe) : null,
        comment: comment || null,
        painFlag,
        painNotes: painNotes || null,
      });
      setSuccess("Guardado correctamente ✓");
    } catch (err) {
      console.error(err);
      setError("Error al guardar el resultado.");
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm">No has iniciado sesión.</p>
    </div>
  );

  if (user.role !== "ATHLETE") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Esta pantalla solo está disponible para atletas.</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Cargando sesión...</p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[11px] text-slate-400 hover:text-slate-200 mb-3 underline"
          >
            ← Volver
          </button>
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
            Registrar resultado · Sesión #{sessionId}
          </p>
          <h1 className="text-2xl font-semibold">
            {existingResultId ? "Actualizar resultado" : "Nuevo resultado"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Per-block result cards */}
          {blocks.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">
                Esta sesión no tiene bloques que requieran resultado.
              </p>
            </div>
          ) : (
            blocks.map((block) => {
              const result = blockResults[block.id];
              if (!result || result.mode === "skip") return null;

              const colors = BLOCK_TYPE_COLORS[block.blockType] ?? BLOCK_TYPE_COLORS["OTHER"];

              return (
                <div
                  key={block.id}
                  className={`bg-slate-900/60 border rounded-2xl p-4 space-y-3 ${colors.border}`}
                >
                  {/* Block header */}
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${colors.accent}`}>
                      {BLOCK_TYPE_LABELS[block.blockType] ?? block.blockType}
                    </span>
                    {block.title && (
                      <p className="text-sm font-semibold text-slate-100 mt-0.5">
                        {block.title}
                      </p>
                    )}
                    {block.description && (
                      <p className="text-xs text-slate-400 mt-0.5 whitespace-pre-line leading-relaxed">
                        {block.description}
                      </p>
                    )}
                  </div>

                  {/* Result inputs */}
                  <div className="pt-1 border-t border-slate-800">
                    {result.mode === "time_series" && (
                      <>
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                          Tiempos (seg o mm:ss)
                        </p>
                        <TimeSeriesInput
                          blockId={block.id}
                          result={result}
                          onChange={updateBlock}
                        />
                      </>
                    )}
                    {result.mode === "weight_sets" && (
                      <>
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                          Series realizadas
                        </p>
                        <WeightSetsInput
                          blockId={block.id}
                          result={result}
                          onChange={updateBlock}
                        />
                      </>
                    )}
                    {result.mode === "notes" && (
                      <>
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                          Notas
                        </p>
                        <textarea
                          value={result.text}
                          onChange={(e) =>
                            updateBlock(block.id, { mode: "notes", text: e.target.value })
                          }
                          rows={2}
                          className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 resize-none"
                          placeholder="Observaciones, sensaciones…"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Global section: RPE + comment + pain */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Valoración general
            </p>

            {/* RPE */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                RPE — Esfuerzo percibido (1–10)
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(rpe === String(n) ? "" : String(n))}
                    className={[
                      "w-8 h-8 rounded-lg text-xs font-semibold border transition-colors",
                      rpe === String(n)
                        ? n <= 3
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : n <= 6
                          ? "bg-amber-600 border-amber-500 text-white"
                          : "bg-red-600 border-red-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comentarios / sensaciones
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 resize-none"
                placeholder="¿Cómo te has sentido? ¿Alguna observación?"
              />
            </div>

            {/* Pain flag */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={painFlag}
                  onChange={(e) => setPainFlag(e.target.checked)}
                  className="w-3.5 h-3.5 accent-red-500"
                />
                <span className="text-xs text-slate-300">
                  He notado dolor o molestia
                </span>
              </label>
              {painFlag && (
                <textarea
                  value={painNotes}
                  onChange={(e) => setPainNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-red-700/50 rounded-lg bg-red-950/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500/60 resize-none"
                  placeholder="¿Dónde? ¿Cuándo? ¿Intensidad?"
                />
              )}
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            {saving ? "Guardando…" : existingResultId ? "Actualizar resultado" : "Guardar resultado"}
          </button>
        </form>
      </div>
    </div>
  );
}