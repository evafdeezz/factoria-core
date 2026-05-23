export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Estructura principal de un grupo tal y como llega desde el backend.
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

// Obtiene todos los grupos disponibles.
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

// Obtiene únicamente los grupos creados por un entrenador concreto.
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

// Busca un grupo por su identificador.
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

// Permite localizar un grupo a partir del código de unión.
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

// Datos necesarios para crear un grupo desde el frontend.
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

// Envía al backend la información necesaria para crear un nuevo grupo.
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

// Elimina un grupo existente.
export async function deleteGroup(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar el grupo");
  }
}

// Actualiza solo los campos del grupo que se hayan modificado.
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