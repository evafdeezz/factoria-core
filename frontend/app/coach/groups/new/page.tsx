"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { createGroup } from "@/lib/groups";

export default function NewGroupPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [competitionCategory, setCompetitionCategory] = useState("");
  const [discipline, setDiscipline] = useState("GENERAL");
  const [distanceProfile, setDistanceProfile] = useState("MIXTO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-200">No has iniciado sesión.</p>
          <Link href="/login" className="text-xs text-sky-300 hover:text-sky-200 underline">
            Ir a la pantalla de login →
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Solo los entrenadores pueden crear grupos.</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Pon al menos un nombre para el grupo.");
      return;
    }

    try {
      setSaving(true);

      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        competitionCategory: competitionCategory || null,
        discipline,
        distanceProfile,
        coachId: user.id,
      });

      router.push(`/coach/groups/${group.id}`);
    } catch (err) {
      console.error(err);
      setError("No se ha podido crear el grupo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={() => router.push("/coach")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver al panel
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Nuevo grupo</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">Crear nuevo grupo</h1>
          <p className="text-xs text-slate-400">Define un grupo para tus atletas (velocidad, vallas, etc.).</p>
        </header>

        <form onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">

          {error && (
            <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del grupo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Velocidad U20" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Grupo de velocidad para atletas sub20..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoría competición</label>
              <select value={competitionCategory} onChange={(e) => setCompetitionCategory(e.target.value)}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100">
                <option value="">Sin categoría</option>
                <option value="SUB16">Sub-16</option>
                <option value="SUB18">Sub-18</option>
                <option value="SUB20">Sub-20</option>
                <option value="SUB23">Sub-23</option>
                <option value="ABSOLUTO">Absoluto</option>
                <option value="MASTER">Master</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Disciplina</label>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100">
                <option value="GENERAL">General</option>
                <option value="VELOCISTA">Velocidad</option>
                <option value="VALLISTA">Vallas</option>
                <option value="SALTADOR">Saltos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Perfil de distancia</label>
              <select value={distanceProfile} onChange={(e) => setDistanceProfile(e.target.value)}
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100">
                <option value="MIXTO">Mixto</option>
                <option value="CORTO">Corto</option>
                <option value="LARGO">Largo</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? "Creando grupo..." : "Crear grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}