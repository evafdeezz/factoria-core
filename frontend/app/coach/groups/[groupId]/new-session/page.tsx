"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createTrainingSession,
  CreateTrainingSessionPayload,
} from "@/lib/trainingSessions";
import { useCurrentUser } from "@/components/CurrentUserProvider";

export default function NewGroupSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const groupId = Number(params.groupId);

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

  if (user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Esta pantalla solo está disponible para entrenadores.
        </p>
      </div>
    );
  }

  const coachId = user.id;
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    startTime: "",
    title: "",
    description: "",
    status: "PLANNED",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      setError("El título es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);
    setMsg(null);

    try {
      const payload: CreateTrainingSessionPayload = {
        date: form.date,
        title: form.title,
        description: form.description || undefined,
        status: (form.status as CreateTrainingSessionPayload["status"]) || undefined,
        coachId,
        groupId,
        startTime: form.startTime ? form.startTime : null,
      };

      await createTrainingSession(payload);
      setMsg("Sesión creada correctamente ✓");

      setTimeout(() => {
        router.push(`/coach/groups/${groupId}`);
      }, 700);
    } catch (err) {
      console.error(err);
      setError("No se ha podido crear la sesión.");
    } finally {
      setSaving(false);
    }
  };

  if (Number.isNaN(groupId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Grupo no válido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline"
        >
          ← Volver
        </button>

        <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">
          Nueva sesión para el grupo #{groupId}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Hora de inicio (opcional)
            </label>
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Ej: Series 3x30m salidas"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            >
              <option value="PLANNED">PLANNED</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Detalle del entrenamiento, bloques, etc."
            />
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {msg && (
            <p className="text-xs text-green-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? "Creando..." : "Crear sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}