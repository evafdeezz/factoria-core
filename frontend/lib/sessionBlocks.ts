export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface SessionBlockDto {
  id: number;
  sessionId: number;
  blockOrder: number;
  blockType: string;
  target: string;
  title: string | null;
  description: string;
}

export async function getBlocksBySession(
  sessionId: number
): Promise<SessionBlockDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/session-blocks/by-session/${sessionId}`,
    { cache: "no-store", credentials: "include" }
  );
  if (!res.ok) throw new Error("Error al obtener los bloques");
  return res.json();
}