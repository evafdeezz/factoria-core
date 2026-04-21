"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/CurrentUserProvider";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "COACH") {
      router.replace("/coach");
      return;
    }

    if (user.role === "ATHLETE") {
      router.replace("/athlete");
      return;
    }

    router.replace("/login");
  }, [loading, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500 text-sm">Cargando…</p>
    </div>
  );
}