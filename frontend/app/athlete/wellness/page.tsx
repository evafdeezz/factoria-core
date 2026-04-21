"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import {
  getWellnessForDate,
  saveWellness,
  WellnessEntryDto,
} from "@/lib/wellness";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type FormState = {
  sleepHours: string;
  fatigue: string;
  soreness: string;
  stress: string;
  mood: string;
  comment: string;
};

export default function AthleteWellnessPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [today] = useState(() => formatDate(new Date()));
  const [form, setForm] = useState<FormState>({
    sleepHours: "",
    fatigue: "",
    soreness: "",
    stress: "",
    mood: "",
    comment: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user || user.role !== "ATHLETE") {
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
        setError(null);
        setSuccess(null);

        const existing: WellnessEntryDto | null = await getWellnessForDate(
          athleteId!,
          today
        );

        if (existing) {
          setForm({
            sleepHours: existing.sleepHours?.toString() ?? "",
            fatigue: existing.fatigue?.toString() ?? "",
            soreness: existing.soreness?.toString() ?? "",
            stress: existing.stress?.toString() ?? "",
            mood: existing.mood?.toString() ?? "",
            comment: existing.comment ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar tu wellness de hoy.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, userLoading, today]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando sesión...</p>
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

  const athleteId = user.athleteProfileId;

  if (!athleteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Aún no tienes perfil de atleta. Completa tu configuración en Ajustes.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: WellnessEntryDto = {
        athlete: { id: athleteId },
        date: today,
        sleepHours: form.sleepHours
          ? Number.parseFloat(form.sleepHours.replace(",", "."))
          : null,
        fatigue: form.fatigue ? Number(form.fatigue) : null,
        soreness: form.soreness ? Number(form.soreness) : null,
        stress: form.stress ? Number(form.stress) : null,
        mood: form.mood ? Number(form.mood) : null,
        comment: form.comment || null,
      };

      await saveWellness(payload);
      setSuccess("Wellness guardado correctamente ✓");
    } catch (err) {
      console.error(err);
      setError("Error al guardar tu wellness.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando wellness de hoy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          type="button"
          onClick={() => router.push("/athlete")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline"
        >
          ← Volver al panel
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
            Wellness · Factoría Core
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">
            Wellness de hoy
          </h1>
          <p className="text-xs text-slate-400">
            Rellena cómo te encuentras hoy · {today}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Horas de sueño
            </label>
            <input
              type="number"
              step="0.5"
              min={0}
              name="sleepHours"
              value={form.sleepHours}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Ej: 7.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fatiga (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                name="fatigue"
                value={form.fatigue}
                onChange={handleChange}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dolor muscular (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                name="soreness"
                value={form.soreness}
                onChange={handleChange}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estrés (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                name="stress"
                value={form.stress}
                onChange={handleChange}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estado de ánimo (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                name="mood"
                value={form.mood}
                onChange={handleChange}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Comentario
            </label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="¿Cómo te encuentras? ¿Algo de dolor, cansancio extra...?"
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
            {saving ? "Guardando..." : "Guardar wellness"}
          </button>
        </form>
      </div>
    </div>
  );
}