"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8085/api";

type PendingOAuthUser = {
  fullName: string;
  email: string;
  pictureUrl?: string;
};

type RegisteredUser = {
  id: number;
  fullName: string;
  email: string;
  role: "COACH" | "ATHLETE";
  pictureUrl?: string | null;
  athleteProfileId?: number | null;
};

type Step = 1 | 2 | 3;

export default function RegisterCompletePage() {
  const router = useRouter();
  const { setUser } = useCurrentUser();

  const [pendingUser, setPendingUser] = useState<PendingOAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [role, setRole] = useState<"COACH" | "ATHLETE" | "">("");

  // Step 2
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<"MALE" | "FEMALE" | "PREFER_NOT_TO_SAY" | "">("");

  // Step 3 — menstrual
  const [menstrualEnabled, setMenstrualEnabled] = useState(false);
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);
  const [menstrualDuration, setMenstrualDuration] = useState(5);
  const [lastPeriodDate, setLastPeriodDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/oauth/pending`, {
          credentials: "include",
        });
        if (!res.ok) { router.replace("/login?tab=register&error=NO_PENDING_OAUTH"); return; }
        const data = (await res.json()) as PendingOAuthUser;
        setPendingUser(data);
        setFullName(data.fullName || "");
      } catch {
        router.replace("/login?tab=register&error=NO_PENDING_OAUTH");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const handleStep1 = () => {
    if (!role) { setError("Selecciona un rol."); return; }
    setError(null);
    setStep(2);
  };

  const handleStep2 = () => {
    if (!fullName.trim()) { setError("El nombre es obligatorio."); return; }
    if (!birthDate) { setError("La fecha de nacimiento es obligatoria."); return; }
    if (!sex) { setError("El sexo es obligatorio."); return; }
    setError(null);
    if (role === "ATHLETE" && sex === "FEMALE") {
      setStep(3);
    } else {
      void submitAll();
    }
  };

  const submitAll = async () => {
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = { role, fullName, birthDate, sex };

    if (role === "ATHLETE" && sex === "FEMALE") {
      payload.menstrualTrackingEnabled = menstrualEnabled;
      if (menstrualEnabled) {
        payload.shareMenstrualDataWithCoach = shareWithCoach;
        payload.cycleLength = cycleLength;
        payload.menstrualDuration = menstrualDuration;
        payload.lastPeriodDate = lastPeriodDate || null;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/oauth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) { router.replace("/login?error=EMAIL_ALREADY_EXISTS"); return; }
        setError("No se ha podido completar el registro.");
        return;
      }

      const data = (await res.json()) as RegisteredUser;
      setUser({
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        pictureUrl: data.pictureUrl ?? null,
        athleteProfileId: data.athleteProfileId ?? null,
      });
      router.replace(data.role === "COACH" ? "/coach" : "/athlete");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900">
      <p className="text-sm text-slate-300">Preparando registro...</p>
    </div>
  );

  if (!pendingUser) return null;

  const initials = pendingUser.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const totalSteps = role === "ATHLETE" && sex === "FEMALE" ? 3 : 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-sky-400 flex-shrink-0">
            {pendingUser.pictureUrl ? (
              <Image src={pendingUser.pictureUrl} alt={pendingUser.fullName}
                fill sizes="64px" className="object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-sky-600 flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-sky-600 uppercase">Factoría Core</p>
            <h1 className="text-xl font-semibold">Completa tu registro</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step > i ? "bg-sky-500" : "bg-slate-200"}`} />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* PASO 1 — Rol */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">¿Cómo vas a usar Factoría Core?</p>
            <div className="grid grid-cols-2 gap-3">
              {(["COACH", "ATHLETE"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`border-2 rounded-xl p-4 text-center transition-all ${role === r ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <p className="text-2xl mb-1">{r === "COACH" ? "🎯" : "🏃"}</p>
                  <p className="text-sm font-semibold">{r === "COACH" ? "Entrenador/a" : "Atleta"}</p>
                </button>
              ))}
            </div>
            <button onClick={handleStep1} disabled={!role}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 — Datos personales */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Cuéntanos un poco sobre ti.</p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Nombre completo</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input type="email" value={pendingUser.email} disabled
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Sexo</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "MALE", label: "Hombre" },
                  { value: "FEMALE", label: "Mujer" },
                  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decirlo" },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setSex(opt.value)}
                    className={`border-2 rounded-lg py-2 px-1 text-xs font-medium transition-all ${sex === opt.value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setStep(1); setError(null); }}
                className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">
                ← Volver
              </button>
              <button type="button" onClick={handleStep2} disabled={submitting}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
                {role === "ATHLETE" && sex === "FEMALE"
                  ? "Continuar →"
                  : submitting ? "Creando..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Ciclo menstrual */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Seguimiento del ciclo menstrual</p>
              <p className="text-xs text-slate-500 mt-1">
                Registrar tu ciclo permite adaptar la planificación a tu cuerpo. Es completamente
                opcional y puedes cambiar tus preferencias en cualquier momento desde Ajustes.
              </p>
            </div>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-sm text-slate-700">Quiero registrar mi ciclo menstrual</span>
              <div onClick={() => setMenstrualEnabled((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${menstrualEnabled ? "bg-sky-500" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${menstrualEnabled ? "left-5" : "left-1"}`} />
              </div>
            </label>

            {menstrualEnabled && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Duración del ciclo (días)</label>
                    <input type="number" min={20} max={45} value={cycleLength}
                      onChange={(e) => setCycleLength(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                    <p className="text-[10px] text-slate-400">Por defecto: 28 días</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Duración menstruación (días)</label>
                    <input type="number" min={2} max={10} value={menstrualDuration}
                      onChange={(e) => setMenstrualDuration(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                    <p className="text-[10px] text-slate-400">Por defecto: 5 días</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Fecha de inicio del último período
                  </label>
                  <input type="date" value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>

                <label className="flex items-center justify-between cursor-pointer select-none gap-3">
                  <div>
                    <p className="text-sm text-slate-700">Compartir datos con mi entrenadora</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Solo tu entrenadora podrá verlos. Puedes revocar el acceso en Ajustes.
                    </p>
                  </div>
                  <div onClick={() => setShareWithCoach((v) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${shareWithCoach ? "bg-sky-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${shareWithCoach ? "left-5" : "left-1"}`} />
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setStep(2); setError(null); }}
                className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">
                ← Volver
              </button>
              <button type="button" onClick={() => void submitAll()} disabled={submitting}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}