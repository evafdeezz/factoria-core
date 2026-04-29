export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface GroupDto {
  id: number;
  name: string;
  description?: string | null;
  coachId: number;
  competitionCategory?: string | null;
  discipline: string;
  distanceProfile: string;
  joinCode?: string | null;
  active: boolean;
  createdAt?: string;
}

export async function getGroups(): Promise<GroupDto[]> {
  const res = await fetch(`${API_BASE_URL}/groups`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener los grupos");
  }

  return res.json();
}

export async function getGroupsByCoach(coachId: number): Promise<GroupDto[]> {
  const res = await fetch(`${API_BASE_URL}/groups/coach/${coachId}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener los grupos del entrenador");
  }

  return res.json();
}

export async function getGroup(id: number): Promise<GroupDto> {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("El grupo no existe");
  }

  return res.json();
}

export async function getGroupByJoinCode(joinCode: string): Promise<GroupDto> {
  const res = await fetch(`${API_BASE_URL}/groups/join/${joinCode}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("El grupo no existe");
  }

  return res.json();
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coachId: number;
  competitionCategory?: string | null;
  discipline: string;
  distanceProfile: string;
  joinCode?: string | null;
  active?: boolean;
}

export async function createGroup(
  payload: CreateGroupPayload
): Promise<GroupDto> {
  const res = await fetch(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al crear el grupo:", txt);
    throw new Error("Error al crear el grupo");
  }

  return res.json();
}

export async function deleteGroup(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar el grupo");
  }
}

export async function updateGroup(
  id: number,
  payload: Partial<CreateGroupPayload>
): Promise<GroupDto> {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Error al actualizar el grupo");
  }

  return res.json();
}