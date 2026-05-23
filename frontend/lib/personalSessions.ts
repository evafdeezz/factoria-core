export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Sesión creada por el propio atleta, fuera de las sesiones asignadas por el coach.
export interface PersonalSessionDto {
  id: number;
  athleteId: number;
  date: string;
  title: string;
  type: "TRAINING" | "COMPETITION";
  notes?: string | null;
}

// Obtiene las sesiones personales registradas por un atleta.
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

// Crea una sesión personal de entrenamiento o competición.
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

// Elimina una sesión personal del calendario del atleta.
export async function deletePersonalSession(id: number): Promise<void> {
  await fetch(`${API_BASE_URL}/personal-sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}