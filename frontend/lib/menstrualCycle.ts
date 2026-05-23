export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export type MenstrualPhase =
  | "MENSTRUAL"
  | "FOLLICULAR"
  | "OVULATORY"
  | "LUTEAL";

// Estado calculado del ciclo que se muestra en el panel del atleta.
export interface CycleStatusDto {
  cycleId: number | null;
  cycleDay: number;
  daysOverdue: number;
  isLate: boolean;
  phase: MenstrualPhase | null;
  phaseLabel: string;
  summary: string;
  training: string;
  warning: string | null;
  emoji: string;
  totalCycleLength: number;
  lastPeriodDate: string;
}

// Registro individual de un ciclo menstrual guardado en el historial.
export interface MenstrualCycleDto {
  id: number;
  athleteId: number;
  startDate: string; // yyyy-MM-dd
  cycleLength?: number | null;
  bleedingDays?: number | null;
  notes?: string | null;
}

export interface RegisterPeriodResponse {
  cycleId: number;
  startDate: string; // yyyy-MM-dd
}

// Obtiene el estado actual del ciclo. Si no hay datos todavía, devuelve null.
export async function getCycleStatus(
  athleteId: number
): Promise<CycleStatusDto | null> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/status`, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 204 || res.status === 404) {
    return null;
  }

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("Error al obtener el estado del ciclo");
  }

  return res.json();
}

// Registra el inicio de un nuevo período para recalcular el ciclo.
export async function registerPeriod(
  athleteId: number,
  startDate?: string | null
): Promise<RegisterPeriodResponse> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      startDate: startDate ?? null,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al registrar período:", txt);
    throw new Error("No se pudo registrar el período");
  }

  return res.json();
}

// Recupera el historial de ciclos registrados por el atleta.
export async function getCycleHistory(
  athleteId: number
): Promise<MenstrualCycleDto[]> {
  const res = await fetch(`${API_BASE_URL}/menstrual/${athleteId}/history`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener el historial de ciclos");
  }

  return res.json();
}