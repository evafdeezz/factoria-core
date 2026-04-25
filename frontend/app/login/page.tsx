"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.251.152.141.nip.io:8085/api";

type Tab = "login" | "register";

function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;

  switch (code) {
    case "USER_NOT_FOUND":
      return "No existe ninguna cuenta con ese correo. Regístrate primero.";
    case "EMAIL_ALREADY_EXISTS":
      return "Ya existe una cuenta con ese correo. Inicie sesión.";
    case "EMAIL_NOT_AVAILABLE":
      return "Google no ha devuelto un correo válido.";
    case "INVALID_ROLE":
      return "El rol seleccionado no es válido.";
    case "NO_PENDING_OAUTH":
      return "No hay ningún registro pendiente con Google.";
    case "google_auth_failed":
      return "No se ha podido completar la autenticación con Google.";
    default:
      return "Se ha producido un error al autenticar con Google.";
  }
}

// Componente interno que usa useSearchParams — necesita estar dentro de <Suspense>
function LoginContent() {
  const searchParams = useSearchParams();

  const initialTab = useMemo<Tab>(() => {
    const tab = searchParams.get("tab");
    return tab === "register" ? "register" : "login";
  }, [searchParams]);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const errorCode =
      searchParams.get("oauthError") || searchParams.get("error");
    setOauthError(getOAuthErrorMessage(errorCode));
  }, [searchParams]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/oauth/login`;
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE_URL}/auth/oauth/register/start`;
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
      <div className="flex border-b border-slate-200 mb-2">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 pb-2 text-sm font-medium text-center ${
            tab === "login"
              ? "border-b-2 border-sky-500 text-sky-600"
              : "text-slate-400"
          }`}
        >
          Iniciar sesión
        </button>

        <button
          type="button"
          onClick={() => setTab("register")}
          className={`flex-1 pb-2 text-sm font-medium text-center ${
            tab === "register"
              ? "border-b-2 border-sky-500 text-sky-600"
              : "text-slate-400"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {oauthError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {oauthError}
        </p>
      )}

      {tab === "login" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-slate-500">
              Entra con tu cuenta de Google si ya estás registrado en
              Factoría Core.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-slate-300 hover:border-slate-400 bg-white rounded-xl py-3 px-4 text-sm font-medium flex items-center justify-center gap-3"
          >
            <span>Iniciar sesión con Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Crear cuenta</h2>
            <p className="text-sm text-slate-500">
              Regístrate con Google. Después te pediremos el rol antes de
              crear tu usuario.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full border border-slate-300 hover:border-slate-400 bg-white rounded-xl py-3 px-4 text-sm font-medium flex items-center justify-center gap-3"
          >
            <span>Registrarse con Google</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.2em] text-sky-300 uppercase">
            Factoría Core
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Organiza y cuida a tu{" "}
            <span className="text-sky-400">grupo de atletas</span>.
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-md">
            Diseñada para grupos de velocidad y vallas: planifica sesiones,
            recoge el wellness diario y sigue el rendimiento de cada atleta en
            un solo lugar.
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              Panel de grupo
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              Resultados de sesión
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              Wellness diario
            </span>
          </div>
        </div>

        {/* Suspense obligatorio por useSearchParams en Next.js App Router */}
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-sm text-slate-400">Cargando...</p>
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}