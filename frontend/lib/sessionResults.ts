export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface SessionResultDto {
  id?: number;
  sessionId?: number;
  athleteId?: number;
  timeMain?: string | null;
  rpe?: number | null;
  comment?: string | null;
  painFlag?: boolean | null;
  painNotes?: string | null;
  videoUrl?: string | null;
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
  videoUrl?: string | null;
}): Promise<SessionResultDto> {
  const res = await fetch(`${API_BASE_URL}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      session: { id: data.sessionId },
      athlete: { id: data.athleteId },
      timeMain: data.timeMain ?? null,
      rpe: data.rpe ?? null,
      comment: data.comment ?? null,
      painFlag: data.painFlag ?? false,
      painNotes: data.painNotes ?? null,
      videoUrl: data.videoUrl ?? null,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al guardar resultado:", txt);
    throw new Error("No se pudo guardar el resultado");
  }
  return res.json();
}