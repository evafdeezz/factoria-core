export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface SessionVideoDto {
  id?: number;
  sessionId: number;
  athleteId: number;
  url: string;
  type?: string | null;
  notes?: string | null;
}

export async function getSessionVideos(
  sessionId: number,
  athleteId: number
): Promise<SessionVideoDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/videos/session/${sessionId}/athlete/${athleteId}`,
    { cache: "no-store", credentials: "include" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function saveSessionVideo(
  data: SessionVideoDto
): Promise<SessionVideoDto> {
  const res = await fetch(`${API_BASE_URL}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      sessionId: data.sessionId,
      athleteId: data.athleteId,
      url:   data.url,
      type:  data.type  ?? null,
      notes: data.notes ?? null,
    }),
  });
  if (!res.ok) throw new Error("No se pudo guardar el enlace");
  return res.json();
}

export async function deleteSessionVideo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/videos/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el enlace");
}