export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8085/api";

export interface TrainingSessionDto {
  id: number;
  date: string;
  startTime?: string | null;
  title: string;
  description?: string | null;
  coachId: number;
  groupId: number;
  source?: string;
  status?: string;
  rawText?: string | null;
  createdAt?: string;
}

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
  source?: string;
  status?: string;
  rawText?: string | null;
  createdAt?: string;
}

function mapTrainingSession(raw: RawTrainingSession): TrainingSessionDto {
  return {
    id: raw.id,
    date: raw.date,
    startTime: raw.startTime,
    title: raw.title,
    description: raw.description,
    coachId: raw.coachId,
    groupId: raw.group?.id ?? -1,
    source: raw.source,
    status: raw.status,
    rawText: raw.rawText,
    createdAt: raw.createdAt,
  };
}

export interface CreateTrainingSessionPayload {
  date: string;
  title: string;
  description?: string;
  coachId: number;
  groupId: number;
  source?: "MANUAL" | "TELEGRAM_IMPORT" | "N8N_IMPORT";
  status?: "PLANNED" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
  startTime?: string | null;
  rawText?: string | null;
}

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
      source: payload.source ?? "MANUAL",
      status: payload.status ?? "PLANNED",
      rawText: payload.rawText ?? null,
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