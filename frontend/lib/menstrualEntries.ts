export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export type MenstrualPhase =
  | "MENSTRUAL"
  | "FOLLICULAR"
  | "OVULATORY"
  | "LUTEAL";

export interface MenstrualEntryDto {
  id?: number;
  cycleId?: number;
  date: string; // yyyy-MM-dd

  // Calculados por el backend
  cycleDay?: number | null;
  estimatedPhase?: MenstrualPhase | null;

  // Introducidos por la atleta
  painLevel?: number | null;
  fatigueLevel?: number | null;
  flowLevel?: number | null;
  mood?: number | null;
  notes?: string | null;
}

export interface SaveMenstrualEntryPayload {
  date: string; // yyyy-MM-dd
  painLevel?: number | null;
  fatigueLevel?: number | null;
  flowLevel?: number | null;
  mood?: number | null;
  notes?: string | null;
}

export async function getCycleEntries(
  athleteId: number,
  cycleId: number
): Promise<MenstrualEntryDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/menstrual/${athleteId}/cycles/${cycleId}/entries`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Error al obtener las entradas del ciclo");
  }

  return res.json();
}

export async function saveCycleEntry(
  athleteId: number,
  cycleId: number,
  entry: SaveMenstrualEntryPayload
): Promise<MenstrualEntryDto> {
  const res = await fetch(
    `${API_BASE_URL}/menstrual/${athleteId}/cycles/${cycleId}/entries`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(entry),
    }
  );

  if (!res.ok) {
    throw new Error("Error al guardar la entrada");
  }

  return res.json();
}

export async function deleteCycleEntry(
  athleteId: number,
  cycleId: number,
  entryId: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/menstrual/${athleteId}/cycles/${cycleId}/entries/${entryId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Error al eliminar la entrada");
  }
}