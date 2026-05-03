"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { updateUser } from "@/lib/users";
import { getAthleteProfile, saveAthleteProfile } from "@/lib/athleteProfile";

const MIN_BIRTH_DATE = "1900-01-01";

type Form = {
  fullName: string;
  email: string;
  birthDate: string;
  sex: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY" | "";
  menstrualEnabled: boolean;
  shareWithCoach: boolean;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidBirthDate(value: string) {
  if (!value) return true;
  return value >= MIN_BIRTH_DATE && value <= todayIsoDate();
}

export default function AthleteSettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useCurrentUser();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (!user || user.role !== "ATHLETE") {
    setLoading(false);
    return;
  }

  const userId = user.id;
  const userFullName = user.fullName;
  const userEmail = user.email;

  async function load() {
    try {
      setLoading(true);

      const profile = await getAthleteProfile(userId).catch(() => null);

      setForm({
        fullName: userFullName,
        email: userEmail,
        birthDate: profile?.birthDate ?? "",
        sex: (profile?.sex as Form["sex"]) ?? "",
        menstrualEnabled: profile?.menstrualTrackingEnabled ?? false,
        shareWithCoach: profile?.shareMenstrualDataWithCoach ?? false,
      });
    } catch {
      setError("No se ha podido cargar tus ajustes.");
    } finally {
      setLoading(false);
    }
  }

  void load();
}, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.role !== "ATHLETE" || !form) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    if (form.birthDate && !isValidBirthDate(form.birthDate)) {
      setError("La fecha de nacimiento debe estar entre 1900 y la fecha actual.");
      setSaving(false);
      return;
    }

    try {
      await updateUser(user.id, {
        fullName: form.fullName,
        email: form.email,
      });

      await saveAthleteProfile(user.id, {
        birthDate: form.birthDate || null,
        sex: form.sex || null,
        menstrualTrackingEnabled: form.menstrualEnabled,
        shareMenstrualDataWithCoach: form.shareWithCoach,
      });

      await refreshUser();

      setMessage("Ajustes guardados correctamente ✓");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se han podido guardar los ajustes."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm">No has iniciado sesión.</p>
          <Link href="/login" className="text-xs text-sky-300 underline">
            Ir al login →
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "ATHLETE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Esta pantalla es solo para atletas.
        </p>
      </div>
    );
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">Cargando ajustes...</p>
      </div>
    );
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isFemale = form.sex === "FEMALE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-5">
        <button
          type="button"
          onClick={() => router.push("/athlete")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline"
        >
          ← Volver al panel
        </button>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-sky-500 shadow-lg flex-shrink-0">
            {user.pictureUrl ? (
              <Image
                src={user.pictureUrl}
                alt={user.fullName}
                fill
                sizes="64px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-sky-700 flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Ajustes
            </p>
            <h1 className="text-2xl font-semibold">Tu perfil de atleta</h1>
            <p className="text-xs text-slate-400">
              Edita tus datos personales.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
              Datos personales
            </p>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, fullName: e.target.value } : f))
                }
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, email: e.target.value } : f))
                }
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.birthDate}
                min={MIN_BIRTH_DATE}
                max={todayIsoDate()}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, birthDate: e.target.value } : f))
                }
                className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-2">
                Sexo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "MALE", label: "Hombre" },
                  { value: "FEMALE", label: "Mujer" },
                  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decirlo" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              sex: opt.value as Form["sex"],
                            }
                          : f
                      )
                    }
                    className={`border rounded-lg py-1.5 px-1 text-[11px] font-medium transition-all ${
                      form.sex === opt.value
                        ? "border-sky-500 bg-sky-900/40 text-sky-300"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isFemale && (
            <button
              type="button"
              onClick={() => router.push("/athlete/settings/menstrual")}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-sky-700 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">
                  Ciclo menstrual
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configura el seguimiento de tu ciclo y tus preferencias de
                  privacidad.
                </p>
              </div>
              <span className="text-sky-400 text-lg ml-3">→</span>
            </button>
          )}

          {error && (
            <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {message && (
            <p className="text-[11px] text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar ajustes"}
          </button>
        </form>
      </div>
    </div>
  );
}