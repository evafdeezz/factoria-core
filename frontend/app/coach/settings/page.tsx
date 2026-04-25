"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import { updateUser } from "@/lib/users";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.251.152.141.nip.io:8085/api";

export default function CoachSettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useCurrentUser();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga birthDate desde el backend (no está en el contexto de usuario)
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/users/${user.id}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.birthDate) setBirthDate(data.birthDate); })
      .catch(() => {});
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <div className="text-center space-y-2">
        <p className="text-sm">No has iniciado sesión.</p>
        <Link href="/login" className="text-xs text-sky-300 underline">Ir al login →</Link>
      </div>
    </div>
  );

  if (user.role !== "COACH") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-xs text-slate-300">Esta pantalla es solo para entrenadores.</p>
    </div>
  );

  const initials = user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await updateUser(user.id, {
        fullName,
        email,
        birthDate: birthDate || null,
      });
      await refreshUser();
      setMessage("Ajustes guardados correctamente ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se han podido guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-5">
        <button type="button" onClick={() => router.push("/coach")}
          className="text-[11px] text-slate-300 hover:text-slate-100 underline">
          ← Volver al panel
        </button>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-sky-500 shadow-lg flex-shrink-0">
            {user.pictureUrl ? (
              <Image src={user.pictureUrl} alt={user.fullName} fill sizes="64px"
                className="object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-sky-700 flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">Ajustes</p>
            <h1 className="text-2xl font-semibold">Tu perfil de entrenador</h1>
            <p className="text-xs text-slate-400">Edita tus datos personales.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Nombre completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Fecha de nacimiento
            </label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-slate-700 rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-100 [color-scheme:dark]" />
            {birthDate && (
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(birthDate + "T00:00:00").toLocaleDateString("es-ES", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
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