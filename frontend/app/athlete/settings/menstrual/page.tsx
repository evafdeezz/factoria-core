"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getAthleteProfile, saveAthleteProfile } from "@/lib/athleteProfile";

type MenstrualForm = {
  menstrualEnabled: boolean;
  shareWithCoach: boolean;
  cycleLength: number;
  menstrualDuration: number;
  lastPeriodDate: string;
};

export default function MenstrualSettingsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [form, setForm] = useState<MenstrualForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ATHLETE") { setLoading(false); return; }

    async function load() {
      try {
        const profile = await getAthleteProfile(user!.id).catch(() => null);
        setForm({
          menstrualEnabled: profile?.menstrualTrackingEnabled ?? false,
          shareWithCoach: profile?.shareMenstrualDataWithCoach ?? false,
          cycleLength: profile?.cycleLength ?? 28,
          menstrualDuration: profile?.menstrualDuration ?? 5,
          lastPeriodDate: profile?.lastPeriodDate ?? "",
        });
      } catch {
        setError("No se han podido cargar los datos.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await saveAthleteProfile(user.id, {
        menstrualTrackingEnabled: form.menstrualEnabled,
        shareMenstrualDataWithCoach: form.shareWithCoach,
        cycleLength: form.menstrualEnabled ? form.cycleLength : null,
        menstrualDuration: form.menstrualEnabled ? form.menstrualDuration : null,
        lastPeriodDate: form.menstrualEnabled && form.lastPeriodDate ? form.lastPeriodDate : null,
      });
      setMessage("Ajustes guardados correctamente ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se han podido guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "ATHLETE") return null;

  if (loading || !form) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-5">
        <button type="button" onClick={() => router.push("/athlete/settings")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver a ajustes
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Ajustes · Ciclo menstrual</p>
          <h1 className="text-2xl font-semibold">Ciclo menstrual</h1>
          <p className="text-xs text-slate-400">
            Registrar tu ciclo ayuda a adaptar la planificación a tu cuerpo.
            Tú controlas qué datos se guardan y quién puede verlos.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">

            {/* Toggle principal */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-medium text-slate-200">Registrar mi ciclo menstrual</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Activa el seguimiento para adaptar los entrenamientos.
                </p>
              </div>
              <div onClick={() => setForm((f) => f ? { ...f, menstrualEnabled: !f.menstrualEnabled } : f)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4 ${form.menstrualEnabled ? "bg-sky-500" : "bg-slate-600"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.menstrualEnabled ? "left-6" : "left-1"}`} />
              </div>
            </label>

            {form.menstrualEnabled && (
              <>
                <div className="border-t border-slate-700 pt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Duración del ciclo (días)
                      </label>
                      <input type="number" min={20} max={45} value={form.cycleLength}
                        onChange={(e) => setForm((f) => f ? { ...f, cycleLength: Number(e.target.value) } : f)}
                        className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100" />
                      <p className="text-[10px] text-slate-500 mt-1">Media: 28 días</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Duración menstruación (días)
                      </label>
                      <input type="number" min={2} max={10} value={form.menstrualDuration}
                        onChange={(e) => setForm((f) => f ? { ...f, menstrualDuration: Number(e.target.value) } : f)}
                        className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100" />
                      <p className="text-[10px] text-slate-500 mt-1">Media: 5 días</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Fecha de inicio del último período
                    </label>
                    <input type="date" value={form.lastPeriodDate}
                      onChange={(e) => setForm((f) => f ? { ...f, lastPeriodDate: e.target.value } : f)}
                      className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
                  </div>
                </div>

                {/* Compartir con entrenadora */}
                <div className="border-t border-slate-700 pt-5">
                  <label className="flex items-center justify-between cursor-pointer select-none gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">Compartir con mi entrenadora</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tu entrenadora podrá ver la fase del ciclo al planificar. Puedes revocar
                        el acceso en cualquier momento.
                      </p>
                    </div>
                    <div onClick={() => setForm((f) => f ? { ...f, shareWithCoach: !f.shareWithCoach } : f)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form.shareWithCoach ? "bg-sky-500" : "bg-slate-600"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.shareWithCoach ? "left-6" : "left-1"}`} />
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">{error}</p>
          )}
          {message && (
            <p className="text-[11px] text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">{message}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar ajustes"}
          </button>
        </form>
      </div>
    </div>
  );
}