"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { getGroupByJoinCode } from "@/lib/groups";
import { joinGroup } from "@/lib/groupMembers";

export default function JoinGroupPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          Solo los atletas pueden unirse a un grupo.
        </p>
      </div>
    );
  }

  if (!user.athleteProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-xs text-slate-300">
          Aún no tienes perfil de atleta. Completa tu configuración en Ajustes antes de unirte a un grupo.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const joinCode = code.trim();

    if (!joinCode) {
      setError("Introduce un código de grupo.");
      return;
    }

    try {
      setLoading(true);

      const group = await getGroupByJoinCode(joinCode);
      await joinGroup(group.id, user.athleteProfileId!);

      setSuccess("Te has unido al grupo correctamente ✓");

      setTimeout(() => {
        router.push("/athlete");
      }, 800);
    } catch (err: any) {
      console.error(err);

      if (typeof err?.message === "string") {
        if (err.message.includes("grupo no existe")) {
          setError("Ese grupo no existe. Revisa el código con tu entrenador.");
          return;
        }
        if (err.message.includes("ya existe")) {
          setError("Ya formas parte de ese grupo.");
          return;
        }
      }

      setError("No se ha podido unir al grupo. Revisa el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5">
        <button
          type="button"
          onClick={() => router.push("/athlete")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline"
        >
          ← Volver al panel
        </button>

        <header className="space-y-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
            Grupo de entrenamiento
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">
            Unirme a un grupo
          </h1>
          <p className="text-xs text-slate-400">
            Introduce el código que te ha pasado tu entrenador.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4"
        >
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Código de grupo
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              placeholder="Ej: ABC123"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[11px] text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Uniéndote..." : "Unirme al grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}