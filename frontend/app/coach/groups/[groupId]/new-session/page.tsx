"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createTrainingSession, CreateTrainingSessionPayload } from "@/lib/trainingSessions";
import { useCurrentUser } from "@/components/CurrentUserProvider";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

const BLOCK_TYPES = [
  { value: "WARMUP",      label: "Calentamiento" },
  { value: "TECHNIQUE",   label: "Técnica" },
  { value: "MAIN_SET",    label: "Series principales" },
  { value: "STRENGTH",    label: "Fuerza" },
  { value: "GYM",         label: "Gimnasio" },
  { value: "PLYOMETRICS", label: "Pliometría" },
  { value: "COOLDOWN",    label: "Vuelta a la calma" },
  { value: "OTHER",       label: "Otro" },
];

const TARGETS = [
  { value: "ALL",               label: "Todos" },
  { value: "VELOCISTA",         label: "Velocistas" },
  { value: "VELOCISTA_CORTO",   label: "Velocistas corto" },
  { value: "VELOCISTA_LARGO",   label: "Velocistas largo" },
  { value: "VALLISTA",          label: "Vallistas" },
  { value: "VALLISTA_CORTO",    label: "Vallistas corto" },
  { value: "VALLISTA_LARGO",    label: "Vallistas largo" },
  { value: "SALTADOR",          label: "Saltadores" },
];

const BLOCK_COLORS: Record<string, string> = {
  WARMUP:      "border-amber-500/50 bg-amber-500/5",
  TECHNIQUE:   "border-sky-500/50 bg-sky-500/5",
  MAIN_SET:    "border-green-500/50 bg-green-500/5",
  STRENGTH:    "border-red-500/50 bg-red-500/5",
  GYM:         "border-orange-500/50 bg-orange-500/5",
  PLYOMETRICS: "border-purple-500/50 bg-purple-500/5",
  COOLDOWN:    "border-teal-500/50 bg-teal-500/5",
  OTHER:       "border-slate-500/50 bg-slate-500/5",
};

const BLOCK_ACCENTS: Record<string, string> = {
  WARMUP:      "text-amber-400",
  TECHNIQUE:   "text-sky-400",
  MAIN_SET:    "text-green-400",
  STRENGTH:    "text-red-400",
  GYM:         "text-orange-400",
  PLYOMETRICS: "text-purple-400",
  COOLDOWN:    "text-teal-400",
  OTHER:       "text-slate-400",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlockDraft {
  uid: string; // local only, for React keys
  blockType: string;
  target: string;
  title: string;
  description: string;
}

function makeBlock(blockType = "MAIN_SET"): BlockDraft {
  return {
    uid: Math.random().toString(36).slice(2),
    blockType,
    target: "ALL",
    title: "",
    description: "",
  };
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NewGroupSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const groupId = Number(params.groupId);

  // Session header state
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [description, setDescription] = useState("");

  // Blocks state
  const [blocks, setBlocks] = useState<BlockDraft[]>([makeBlock("WARMUP"), makeBlock("MAIN_SET"), makeBlock("COOLDOWN")]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-200">No has iniciado sesión.</p>
      </div>
    );
  }

  if (user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Esta pantalla solo está disponible para entrenadores.</p>
      </div>
    );
  }

  if (Number.isNaN(groupId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Grupo no válido.</p>
      </div>
    );
  }

  // ── Block helpers ─────────────────────────────────────────────────────────────

  const updateBlock = (uid: string, field: keyof BlockDraft, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.uid === uid ? { ...b, [field]: value } : b))
    );
  };

  const removeBlock = (uid: string) => {
    setBlocks((prev) => prev.filter((b) => b.uid !== uid));
  };

  const addBlock = () => {
    setBlocks((prev) => [...prev, makeBlock("OTHER")]);
  };

  const moveBlock = (uid: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.uid === uid);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProgress(null);

    if (!title.trim()) {
      setError("El título de la sesión es obligatorio.");
      return;
    }

    // Validate blocks
    for (let i = 0; i < blocks.length; i++) {
      if (!blocks[i].description.trim()) {
        setError(`El bloque ${i + 1} (${BLOCK_TYPES.find(t => t.value === blocks[i].blockType)?.label}) necesita una descripción.`);
        return;
      }
    }

    try {
      setSaving(true);

      // 1 — Create the session
      setProgress("Creando sesión...");
      const payload: CreateTrainingSessionPayload = {
        date,
        title: title.trim(),
        description: description.trim() || undefined,
        status: status as CreateTrainingSessionPayload["status"],
        coachId: user.id,
        groupId,
        startTime: startTime || null,
      };
      const session = await createTrainingSession(payload);

      // 2 — Create each block in order
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        setProgress(`Guardando bloque ${i + 1} de ${blocks.length}...`);

        const res = await fetch(`${API_BASE_URL}/session-blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            session: { id: session.id },
            blockOrder: i + 1,
            blockType: block.blockType,
            target: block.target,
            title: block.title.trim() || null,
            description: block.description.trim(),
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error("Error creando bloque:", txt);
          throw new Error(`Error al guardar el bloque ${i + 1}`);
        }
      }

      setProgress("¡Sesión creada!");
      setTimeout(() => router.push(`/coach/groups/${groupId}`), 600);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se ha podido crear la sesión.");
      setProgress(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">

        <button type="button" onClick={() => router.back()}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver
        </button>

        <header>
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Nueva sesión</p>
          <h1 className="text-2xl font-semibold text-slate-50">Crear entrenamiento</h1>
          <p className="text-xs text-slate-400 mt-0.5">Define la sesión y añade los bloques de entrenamiento.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Session header ───────────────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Datos de la sesión
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hora (opcional)</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Título</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Viernes – Semana 4 (Velocidad)"
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100">
                <option value="PLANNED">Planificada</option>
                <option value="PUBLISHED">Publicada</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción general (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={2} placeholder="Notas generales sobre la sesión..."
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 resize-none" />
            </div>
          </div>

          {/* ── Blocks ───────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Bloques de entrenamiento ({blocks.length})
              </p>
              <button type="button" onClick={addBlock}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium">
                + Añadir bloque
              </button>
            </div>

            {blocks.length === 0 && (
              <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
                <p className="text-xs text-slate-500">Sin bloques. Añade al menos uno.</p>
              </div>
            )}

            {blocks.map((block, idx) => (
              <div key={block.uid}
                className={`border rounded-2xl p-4 space-y-3 ${BLOCK_COLORS[block.blockType] ?? BLOCK_COLORS.OTHER}`}>

                {/* Block header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${BLOCK_ACCENTS[block.blockType] ?? BLOCK_ACCENTS.OTHER}`}>
                      Bloque {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveBlock(block.uid, -1)} disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveBlock(block.uid, 1)} disabled={idx === blocks.length - 1}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">
                      ↓
                    </button>
                    <button type="button" onClick={() => removeBlock(block.uid)}
                      className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 text-xs ml-1">
                      ✕
                    </button>
                  </div>
                </div>

                {/* Type + Target */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Tipo</label>
                    <select value={block.blockType}
                      onChange={(e) => updateBlock(block.uid, "blockType", e.target.value)}
                      className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100">
                      {BLOCK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Dirigido a</label>
                    <select value={block.target}
                      onChange={(e) => updateBlock(block.uid, "target", e.target.value)}
                      className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100">
                      {TARGETS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title (optional) */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Título del bloque <span className="text-slate-600">(opcional)</span>
                  </label>
                  <input type="text" value={block.title}
                    onChange={(e) => updateBlock(block.uid, "title", e.target.value)}
                    placeholder="Ej: Salidas tacos, Series progresivas..."
                    className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Descripción <span className="text-red-400/70">*</span>
                  </label>
                  <textarea value={block.description}
                    onChange={(e) => updateBlock(block.uid, "description", e.target.value)}
                    rows={3}
                    placeholder="Ej: 4x60m salidas tacos. Rec: 8'. Intensidad: 95%"
                    className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 resize-none leading-relaxed" />
                </div>
              </div>
            ))}

            {/* Add block shortcut buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {BLOCK_TYPES.map((t) => (
                <button key={t.value} type="button"
                  onClick={() => setBlocks((prev) => [...prev, makeBlock(t.value)])}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                  + {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Feedback & Submit ─────────────────────────────────────────── */}
          {error && (
            <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {progress && (
            <p className="text-xs text-sky-300 bg-sky-900/30 border border-sky-700/50 rounded-lg px-3 py-2">
              {progress}
            </p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {saving ? "Guardando..." : `Crear sesión con ${blocks.length} bloque${blocks.length !== 1 ? "s" : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}