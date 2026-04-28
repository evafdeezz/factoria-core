"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

type CurrentUserResponse = {
  id: number;
  fullName: string;
  email: string;
  role: "COACH" | "ATHLETE";
  pictureUrl?: string | null;
  athleteProfileId?: number | null;
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useCurrentUser();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const loadUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Error /api/auth/me:", res.status, text);
          router.replace("/login?error=USER_NOT_FOUND");
          return;
        }

        const data = (await res.json()) as CurrentUserResponse;

        setUser({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          pictureUrl: data.pictureUrl ?? null,
          athleteProfileId: data.athleteProfileId ?? null,
        });

        if (data.role === "COACH") {
          router.replace("/coach");
        } else if (data.role === "ATHLETE") {
          router.replace("/athlete");
        } else {
          console.error("Rol no válido:", data.role);
          router.replace("/login?error=INVALID_ROLE");
        }
      } catch (error) {
        console.error("Error en callback OAuth:", error);
        router.replace("/login?error=USER_NOT_FOUND");
      }
    };

    void loadUser();
  }, [router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 text-slate-100">
      <p className="text-sm text-slate-300">Completando inicio de sesión...</p>
    </div>
  );
}