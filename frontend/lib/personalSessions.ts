export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface PersonalSessionDto {
  id: number;
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}

export async function getPersonalSessions(
  athleteId: number
): Promise<PersonalSessionDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/personal-sessions/athlete/${athleteId}`,
    { cache: "no-store", credentials: "include" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function createPersonalSession(data: {
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}): Promise<PersonalSessionDto> {
  const res = await fetch(`${API_BASE_URL}/personal-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo crear la sesión");
  return res.json();
}

export async function deletePersonalSession(id: number): Promise<void> {
  await fetch(`${API_BASE_URL}/personal-sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}