"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  { value: "ALL",             label: "Todos" },
  { value: "VELOCISTA",       label: "Velocistas" },
  { value: "VELOCISTA_CORTO", label: "Velocistas corto" },
  { value: "VELOCISTA_LARGO", label: "Velocistas largo" },
  { value: "VALLISTA",        label: "Vallistas" },
  { value: "VALLISTA_CORTO",  label: "Vallistas corto" },
  { value: "VALLISTA_LARGO",  label: "Vallistas largo" },
  { value: "SALTADOR",        label: "Saltadores" },
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionHeader {
  date: string;
  startTime: string;
  title: string;
  status: string;
  description: string;
  groupId: number;
  coachId: number;
}

type BlockStatus = "saved" | "new" | "modified" | "deleted";

interface BlockDraft {
  uid: string;
  id?: number;        // undefined = new (not yet in backend)
  blockType: string;
  target: string;
  title: string;
  description: string;
  status: BlockStatus;
}

function uid() { return Math.random().toString(36).slice(2); }

function makeNewBlock(blockType = "OTHER"): BlockDraft {
  return { uid: uid(), blockType, target: "ALL", title: "", description: "", status: "new" };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditSessionPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user } = useCurrentUser();
  const sessionId = Number(params.sessionId);

  // Session header
  const [header, setHeader] = useState<SessionHeader | null>(null);

  // Blocks — includes deleted ones (hidden but tracked for cleanup)
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Number.isNaN(sessionId)) return;

    async function load() {
      try {
        setLoading(true);
        const [sessRes, blocksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/sessions/${sessionId}`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/session-blocks/by-session/${sessionId}`, { credentials: "include" }),
        ]);

        if (!sessRes.ok) throw new Error("Sesión no encontrada");
        const sess = await sessRes.json();

        setHeader({
          date:        sess.date ?? "",
          startTime:   sess.startTime ?? "",
          title:       sess.title ?? "",
          status:      sess.status ?? "PLANNED",
          description: sess.description ?? "",
          groupId:     sess.group?.id ?? sess.groupId ?? -1,
          coachId:     sess.coachId ?? -1,
        });

        if (blocksRes.ok) {
          const raw = await blocksRes.json();
          const drafts: BlockDraft[] = (raw as any[])
            .sort((a, b) => a.blockOrder - b.blockOrder)
            .map((b) => ({
              uid:         uid(),
              id:          b.id,
              blockType:   b.blockType,
              target:      b.target ?? "ALL",
              title:       b.title ?? "",
              description: b.description ?? "",
              status:      "saved" as BlockStatus,
            }));
          setBlocks(drafts);
        }
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar la sesión.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionId]);

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (!user || user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Solo los entrenadores pueden editar sesiones.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando sesión...</p>
      </div>
    );
  }

  if (!header) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-200">Sesión no encontrada.</p>
          <button onClick={() => router.back()} className="text-xs text-sky-300 underline">← Volver</button>
        </div>
      </div>
    );
  }

  // ── Block helpers ─────────────────────────────────────────────────────────────

  const visibleBlocks = blocks.filter((b) => b.status !== "deleted");

  const updateBlock = (uid: string, field: keyof BlockDraft, value: string) => {
    setBlocks((prev) => prev.map((b) =>
      b.uid === uid
        ? { ...b, [field]: value, status: b.status === "saved" ? "modified" : b.status }
        : b
    ));
  };

  const removeBlock = (uid: string) => {
    setBlocks((prev) => prev.map((b) =>
      b.uid === uid
        ? { ...b, status: b.id ? "deleted" : "deleted" } // both cases mark deleted
        : b
    ));
  };

  const addBlock = (blockType = "OTHER") => {
    setBlocks((prev) => [...prev, makeNewBlock(blockType)]);
  };

  const moveBlock = (uid: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const visible = prev.filter((b) => b.status !== "deleted");
      const idx = visible.findIndex((b) => b.uid === uid);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= visible.length) return prev;

      // Swap in the full array
      const fullIdxA = prev.findIndex((b) => b.uid === visible[idx].uid);
      const fullIdxB = prev.findIndex((b) => b.uid === visible[next].uid);
      const copy = [...prev];
      [copy[fullIdxA], copy[fullIdxB]] = [copy[fullIdxB], copy[fullIdxA]];

      // Mark both as modified if they were saved
      return copy.map((b) =>
        (b.uid === visible[idx].uid || b.uid === visible[next].uid) && b.status === "saved"
          ? { ...b, status: "modified" }
          : b
      );
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProgress(null);

    if (!header.title.trim()) { setError("El título es obligatorio."); return; }

    for (const b of visibleBlocks) {
      if (!b.description.trim()) {
        const label = BLOCK_TYPES.find((t) => t.value === b.blockType)?.label ?? b.blockType;
        setError(`El bloque "${label}" necesita una descripción.`);
        return;
      }
    }

    try {
      setSaving(true);

      // 1 — Update session header
      setProgress("Guardando sesión...");
      const sessRes = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date:        header.date,
          startTime:   header.startTime || null,
          title:       header.title.trim(),
          description: header.description.trim() || null,
          status:      header.status,
          coachId:     header.coachId,
          group:       { id: header.groupId },
        }),
      });
      if (!sessRes.ok) throw new Error("Error al guardar la sesión.");

      // 2 — Delete removed blocks
      const toDelete = blocks.filter((b) => b.status === "deleted" && b.id);
      for (let i = 0; i < toDelete.length; i++) {
        setProgress(`Eliminando bloque ${i + 1} de ${toDelete.length}...`);
        await fetch(`${API_BASE_URL}/session-blocks/${toDelete[i].id}`, {
          method: "DELETE", credentials: "include",
        });
      }

      // 3 — Update modified blocks & create new ones (in visible order)
      let order = 1;
      for (const block of visibleBlocks) {
        if (block.status === "new") {
          setProgress(`Creando bloque "${BLOCK_TYPES.find(t => t.value === block.blockType)?.label}"...`);
          await fetch(`${API_BASE_URL}/session-blocks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              session:     { id: sessionId },
              blockOrder:  order,
              blockType:   block.blockType,
              target:      block.target,
              title:       block.title.trim() || null,
              description: block.description.trim(),
            }),
          });
        } else if (block.status === "modified" && block.id) {
          setProgress(`Actualizando bloque ${order}...`);
          await fetch(`${API_BASE_URL}/session-blocks/${block.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              blockOrder:  order,
              blockType:   block.blockType,
              target:      block.target,
              title:       block.title.trim() || null,
              description: block.description.trim(),
            }),
          });
        } else if (block.status === "saved" && block.id) {
          // Update order even if content unchanged
          await fetch(`${API_BASE_URL}/session-blocks/${block.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              blockOrder:  order,
              blockType:   block.blockType,
              target:      block.target,
              title:       block.title.trim() || null,
              description: block.description.trim(),
            }),
          });
        }
        order++;
      }

      setProgress("¡Guardado!");
      setTimeout(() => router.push(`/coach/groups/${header.groupId}`), 600);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setProgress(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const changedBlocks = blocks.filter((b) => b.status !== "saved").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">

        <button type="button" onClick={() => router.back()}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver
        </button>

        <header>
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Editar sesión #{sessionId}</p>
          <h1 className="text-2xl font-semibold">{header.title || "Sin título"}</h1>
          {changedBlocks > 0 && (
            <p className="text-[11px] text-amber-400 mt-0.5">
              {changedBlocks} cambio{changedBlocks !== 1 ? "s" : ""} sin guardar
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Session header ───────────────────────────────────────────── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Datos de la sesión
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha</label>
                <input type="date" value={header.date}
                  onChange={(e) => setHeader({ ...header, date: e.target.value })}
                  className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hora (opcional)</label>
                <input type="time" value={header.startTime}
                  onChange={(e) => setHeader({ ...header, startTime: e.target.value })}
                  className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Título</label>
              <input type="text" value={header.title}
                onChange={(e) => setHeader({ ...header, title: e.target.value })}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500/60" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción general</label>
              <textarea value={header.description}
                onChange={(e) => setHeader({ ...header, description: e.target.value })}
                rows={2}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500/60 resize-none" />
            </div>
          </div>

          {/* ── Blocks ───────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Bloques ({visibleBlocks.length})
              </p>
              <button type="button" onClick={() => addBlock()}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium">
                + Añadir bloque
              </button>
            </div>

            {visibleBlocks.length === 0 && (
              <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
                <p className="text-xs text-slate-500">Sin bloques. Añade al menos uno.</p>
              </div>
            )}

            {visibleBlocks.map((block, idx) => (
              <div key={block.uid}
                className={`border rounded-2xl p-4 space-y-3 ${BLOCK_COLORS[block.blockType] ?? BLOCK_COLORS.OTHER} ${block.status === "new" ? "ring-1 ring-sky-500/40" : ""} ${block.status === "modified" ? "ring-1 ring-amber-500/40" : ""}`}>

                {/* Block header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${BLOCK_ACCENTS[block.blockType] ?? BLOCK_ACCENTS.OTHER}`}>
                      Bloque {idx + 1}
                    </span>
                    {block.status === "new" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-900/60 border border-sky-700/50 text-sky-400">nuevo</span>
                    )}
                    {block.status === "modified" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/60 border border-amber-700/50 text-amber-400">editado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveBlock(block.uid, -1)} disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">↑</button>
                    <button type="button" onClick={() => moveBlock(block.uid, 1)} disabled={idx === visibleBlocks.length - 1}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs">↓</button>
                    <button type="button" onClick={() => removeBlock(block.uid)}
                      className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Tipo</label>
                    <select value={block.blockType} onChange={(e) => updateBlock(block.uid, "blockType", e.target.value)}
                      className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100">
                      {BLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Dirigido a</label>
                    <select value={block.target} onChange={(e) => updateBlock(block.uid, "target", e.target.value)}
                      className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100">
                      {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Título <span className="text-slate-600">(opcional)</span>
                  </label>
                  <input type="text" value={block.title} onChange={(e) => updateBlock(block.uid, "title", e.target.value)}
                    placeholder="Ej: Salidas tacos, Circuito de fuerza..."
                    className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50" />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Descripción <span className="text-red-400/70">*</span>
                  </label>
                  <textarea value={block.description} onChange={(e) => updateBlock(block.uid, "description", e.target.value)}
                    rows={3} placeholder="Ej: 4x60m salidas tacos. Rec: 8'. Intensidad: 95%"
                    className="w-full border border-slate-700 rounded-lg bg-slate-950/50 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 resize-none leading-relaxed" />
                </div>
              </div>
            ))}

            {/* Quick-add shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              {BLOCK_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => addBlock(t.value)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                  + {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Feedback & submit ─────────────────────────────────────────── */}
          {error && (
            <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
          )}
          {progress && (
            <p className="text-xs text-sky-300 bg-sky-900/30 border border-sky-700/50 rounded-lg px-3 py-2">{progress}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}