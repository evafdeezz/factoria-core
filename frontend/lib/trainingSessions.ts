export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Sesión de entrenamiento ya adaptada al formato que usa el frontend.
export interface TrainingSessionDto {
  id: number;
  date: string;
  startTime?: string | null;
  title: string;
  description?: string | null;
  coachId: number;
  groupId: number;
  createdAt?: string;
}

// Formato original que llega desde el backend.
interface RawTrainingSession {
  id: number;
  date: string;
  startTime?: string | null;
  title: string;
  description?: string | null;
  coachId: number;
  group?: {
    id: number;
    name?: string;
  };
  createdAt?: string;
}

// Convierte la respuesta del backend en un objeto más cómodo para las pantallas.
function mapTrainingSession(raw: RawTrainingSession): TrainingSessionDto {
  return {
    id: raw.id,
    date: raw.date,
    startTime: raw.startTime,
    title: raw.title,
    description: raw.description,
    coachId: raw.coachId,
    groupId: raw.group?.id ?? -1,
    createdAt: raw.createdAt,
  };
}

// Datos necesarios para crear una sesión de entrenamiento.
export interface CreateTrainingSessionPayload {
  date: string;
  title: string;
  description?: string;
  coachId: number;
  groupId: number;
  startTime?: string | null;
}

// Obtiene todas las sesiones asignadas a un atleta.
export async function getAthleteSessions(
  athleteId: number
): Promise<TrainingSessionDto[]> {
  const url = `${API_BASE_URL}/athletes/${athleteId}/sessions`;

  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 404 || res.status === 204) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Error al obtener las sesiones del atleta");
  }

  const raw = (await res.json()) as RawTrainingSession[];
  return raw.map(mapTrainingSession);
}

// Obtiene las sesiones programadas para hoy de un atleta concreto.
export async function getAthleteTodaySessions(
  athleteId: number
): Promise<TrainingSessionDto[]> {
  const url = `${API_BASE_URL}/athletes/${athleteId}/sessions/today`;

  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 404 || res.status === 204) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Error al obtener las sesiones de hoy");
  }

  const raw = (await res.json()) as RawTrainingSession[];
  return raw.map(mapTrainingSession);
}

// Obtiene las sesiones de hoy asociadas a un grupo.
export async function getGroupTodaySessions(
  groupId: number
): Promise<TrainingSessionDto[]> {
  const url = `${API_BASE_URL}/sessions/group/${groupId}/today`;

  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 404 || res.status === 204) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Error al obtener las sesiones de hoy del grupo");
  }

  const raw = (await res.json()) as RawTrainingSession[];
  return raw.map(mapTrainingSession);
}

// Crea una nueva sesión y adapta la respuesta al formato del frontend.
export async function createTrainingSession(
  payload: CreateTrainingSessionPayload
): Promise<TrainingSessionDto> {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      date: payload.date,
      startTime: payload.startTime ?? null,
      title: payload.title,
      description: payload.description ?? null,
      coachId: payload.coachId,
      group: { id: payload.groupId },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al crear sesión:", txt);
    throw new Error("No se pudo crear la sesión");
  }

  const raw = (await res.json()) as RawTrainingSession;
  return mapTrainingSession(raw);
}