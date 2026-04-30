export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface CycleStatusDto {
  cycleId: number | null;        // ← añadir este campo
  cycleDay: number;
  daysOverdue: number;
  isLate: boolean;
  phase: "MENSTRUAL" | "FOLLICULAR" | "OVULATORY" | "LUTEAL" | null;
  phaseLabel: string;
  summary: string;
  training: string;
  warning: string | null;
  emoji: string;
  totalCycleLength: number;
  lastPeriodDate: string;
}

export interface MenstrualCycleDto {
  id: number;
  athleteId: number;
  startDate: string;
  cycleLength?: number | null;
  bleedingDays?: number | null;
  notes?: string | null;
}

export async function getCycleStatus(
  athleteId: number
): Promise<CycleStatusDto | null> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/status`, {
    cache: "no-store",
    credentials: "include",
  });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error("Error al obtener el estado del ciclo");
  return res.json();
}

// Devuelve el cycleId del ciclo recién creado
export async function registerPeriod(
  athleteId: number,
  startDate?: string | null
): Promise<{ cycleId: number; startDate: string }> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ startDate: startDate ?? null }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al registrar período:", txt);
    throw new Error("No se pudo registrar el período");
  }
  return res.json();
}

export async function getCycleHistory(
  athleteId: number
): Promise<MenstrualCycleDto[]> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/history`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener el historial de ciclos");
  return res.json();
}