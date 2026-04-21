"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroup, updateGroup, GroupDto } from "@/lib/groups";
import { useCurrentUser } from "@/components/CurrentUserProvider";

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const groupId = Number(params.groupId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [competitionCategory, setCompetitionCategory] = useState("");
  const [discipline, setDiscipline] = useState("GENERAL");
  const [distanceProfile, setDistanceProfile] = useState("MIXTO");
  const [trainingSlot, setTrainingSlot] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (Number.isNaN(groupId)) return;

    async function load() {
      try {
        setLoading(true);
        const g = await getGroup(groupId);
        setName(g.name);
        setDescription(g.description ?? "");
        setCompetitionCategory(g.competitionCategory ?? "");
        setDiscipline(g.discipline ?? "GENERAL");
        setDistanceProfile(g.distanceProfile ?? "MIXTO");
        setTrainingSlot(g.trainingSlot ?? "");
        setActive(g.active);
      } catch (err) {
        console.error(err);
        setError("No se ha podido cargar el grupo.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [groupId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      await updateGroup(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        competitionCategory: competitionCategory || null,
        discipline,
        distanceProfile,
        trainingSlot: trainingSlot || null,
        active,
      });
      router.push(`/coach/groups/${groupId}`);
    } catch (err) {
      console.error(err);
      setError("No se ha podido actualizar el grupo.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Solo los entrenadores pueden editar grupos.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando grupo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={() => router.push(`/coach/groups/${groupId}`)}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver al grupo
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Editar grupo</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">Modificar grupo</h1>
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
              required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100" />
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

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-300">Grupo activo</label>
            <button type="button" onClick={() => setActive(!active)}
              className={`relative w-10 h-5 rounded-full transition-colors ${active ? "bg-sky-600" : "bg-slate-700"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-xs text-slate-400">{active ? "Sí" : "No"}</span>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}