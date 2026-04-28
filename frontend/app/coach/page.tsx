"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getGroupsByCoach, GroupDto } from "@/lib/groups";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export default function CoachHomePage() {
  const router = useRouter();
  const { user, loading: userLoading, setUser } = useCurrentUser();

  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user || user.role !== "COACH") {
      setLoading(false);
      return;
    }

    const coachId = user.id;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getGroupsByCoach(coachId);
        setGroups(data);
      } catch (err) {
        console.error(err);
        setError("No se han podido cargar los grupos.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, userLoading]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error cerrando sesión en backend", err);
    } finally {
      setUser(null);
      router.push("/login");
      setLogoutLoading(false);
    }
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

  if (user.role !== "COACH") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-300">
            Esta pantalla solo está disponible para entrenadores.
          </p>
          <Link
            href="/athlete"
            className="text-xs text-sky-300 hover:text-sky-200 underline"
          >
            Ir al panel de atleta →
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
        <p className="text-sm text-slate-300">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-sky-300">
              Entrenador · Factoría Core
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              Hola, <span className="text-sky-300">{currentUser.fullName}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Panel de entrenador · gestiona tus grupos y sesiones.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link
              href="/coach/settings"
              className="text-[11px] px-3 py-1 rounded-full border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-100"
            >
              Ajustes
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="text-[11px] text-slate-300 hover:text-slate-100 underline disabled:opacity-60"
            >
              {logoutLoading ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            Tus grupos activos aparecen aquí abajo.
          </p>
          <Link
            href="/coach/groups/new"
            className="inline-flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg"
          >
            + Crear grupo
          </Link>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {groups.length === 0 && !error && (
          <p className="text-sm text-slate-300">
            No hay grupos creados todavía. Crea el primero para organizar tus
            atletas.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/coach/groups/${g.id}`}
              className="group bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg px-4 py-3 hover:border-sky-500 hover:bg-slate-900/80 transition"
            >
              <p className="font-semibold text-slate-50 group-hover:text-sky-200">
                {g.name}
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                {g.competitionCategory ?? "Sin categoría"} ·{" "}
                {g.discipline ?? "Sin disciplina"}
              </p>

              <p className="text-[11px] text-slate-500 mt-1">
                {g.distanceProfile ?? "Sin perfil"} ·{" "}
                {g.trainingSlot ?? "Sin turno"}
              </p>

              {g.joinCode && (
                <p className="text-[11px] text-sky-300 mt-2">
                  Código de acceso: {g.joinCode}
                </p>
              )}

              {g.description && (
                <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                  {g.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}