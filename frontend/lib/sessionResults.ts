export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.251.152.141.nip.io:8085/api";

// Lo que devuelve el backend (campos planos por @JsonIgnore en getters lazy)
export interface SessionResultDto {
  id?: number;
  sessionId?: number;   // campo plano, no session: { id }
  athleteId?: number;   // campo plano, no athlete: { id }
  timeMain?: string | null;
  rpe?: number | null;
  comment?: string | null;
  painFlag?: boolean | null;
  painNotes?: string | null;
  recordedAt?: string;
}

export async function getResultsByAthlete(
  athleteId: number
): Promise<SessionResultDto[]> {
  const res = await fetch(`${API_BASE_URL}/results/athlete/${athleteId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener los resultados del atleta");
  return res.json();
}

export async function getResultsBySession(
  sessionId: number
): Promise<SessionResultDto[]> {
  const res = await fetch(`${API_BASE_URL}/results/session/${sessionId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener los resultados de la sesión");
  return res.json();
}

export async function getSessionResult(
  athleteId: number,
  sessionId: number
): Promise<SessionResultDto | null> {
  const results = await getResultsBySession(sessionId);
  // Buscar por athleteId (campo plano) en lugar de athlete?.id
  return results.find((r) => r.athleteId === athleteId) ?? null;
}

export async function saveSessionResult(data: {
  sessionId: number;
  athleteId: number;
  timeMain?: string | null;
  rpe?: number | null;
  comment?: string | null;
  painFlag?: boolean | null;
  painNotes?: string | null;
}): Promise<SessionResultDto> {
  const res = await fetch(`${API_BASE_URL}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    // El backend deserializa session/athlete como objetos con id
    body: JSON.stringify({
      session: { id: data.sessionId },
      athlete: { id: data.athleteId },
      timeMain: data.timeMain ?? null,
      rpe: data.rpe ?? null,
      comment: data.comment ?? null,
      painFlag: data.painFlag ?? false,
      painNotes: data.painNotes ?? null,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al guardar resultado:", txt);
    throw new Error("No se pudo guardar el resultado");
  }

  return res.json();
}