"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getSessionResult,
  saveSessionResult,
} from "@/lib/sessionResults";
import { useCurrentUser } from "@/components/CurrentUserProvider";

type FormState = {
  id?: number;
  time: string;
  rpe: string;
  comments: string;
  videoUrl: string; // solo front de momento
};

export default function SessionResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();

  const sessionId = Number(params.sessionId);

  const [form, setForm] = useState<FormState>({
    time: "",
    rpe: "",
    comments: "",
    videoUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ATHLETE" || Number.isNaN(sessionId)) {
      setLoading(false);
      return;
    }

    const athleteId = user.athleteProfileId;
    if (!athleteId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const data = await getSessionResult(athleteId!, sessionId);

        if (data) {
          setForm({
            id: data.id,
            time: data.timeMain ?? "",
            rpe: data.rpe?.toString() ?? "",
            comments: data.comment ?? "",
            videoUrl: "",
          });
        }
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el resultado");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, sessionId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.athleteProfileId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveSessionResult({
        sessionId,
        athleteId: user.athleteProfileId,
        timeMain: form.time || null,
        rpe: form.rpe ? Number(form.rpe) : null,
        comment: form.comments || null,
        painFlag: false,
        painNotes: null,
      });

      setSuccess("Guardado correctamente ✓");
    } catch (err) {
      console.error(err);
      setError("Error al guardar el resultado");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-200">No has iniciado sesión.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-xs text-sky-300 hover:text-sky-200 underline"
          >
            Ir a la pantalla de login →
          </button>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">
          Cargando resultado de la sesión...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-slate-300 hover:text-slate-100 mb-4 underline"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-semibold mb-1">
          Resultado de la sesión
        </h1>
        <p className="text-xs text-slate-400 mb-4">
          Registra tus tiempos, sensaciones y, si quieres, el vídeo.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-4 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tiempos
            </label>
            <textarea
              name="time"
              value={form.time}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Ej: 3x30m: 4.02, 3.98, 4.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              RPE (1–10)
            </label>
            <input
              name="rpe"
              type="number"
              min={1}
              max={10}
              value={form.rpe}
              onChange={handleChange}
              className="w-24 border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Comentarios / sensaciones
            </label>
            <textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Vídeo (opcional)
            </label>
            <input
              name="videoUrl"
              type="url"
              value={form.videoUrl}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Enlace a YouTube, Drive..."
            />
          </div>

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
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>
        </form>
      </div>
    </div>
  );
}