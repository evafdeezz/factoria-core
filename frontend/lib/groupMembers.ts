export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Datos básicos de la relación entre un atleta y un grupo.
export interface GroupMemberDto {
  id: number;
  groupId?: number;
  athleteId?: number;
  joinedAt?: string;
  active: boolean;
}

// Datos más completos del miembro, usados cuando el coach necesita mostrar información del atleta.
export interface GroupMemberDetailDto {
  id: number;
  groupId: number;
  athleteId: number;
  athleteUserId: number; // Id del usuario atleta, necesario para navegar a su perfil
  athleteName: string;
  athletePicture?: string | null;
  joinedAt?: string;
  active: boolean;
}

// Obtiene los miembros de un grupo concreto.
export async function getGroupMembers(groupId: number): Promise<GroupMemberDto[]> {
  const res = await fetch(`${API_BASE_URL}/group-members/by-group/${groupId}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al obtener los miembros del grupo");
  return res.json();
}

// Versión detallada para mostrar nombre, foto y datos del atleta.
export async function getGroupMembersDetailed(
  groupId: number
): Promise<GroupMemberDetailDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/group-members/by-group/${groupId}/detailed`,
    { cache: "no-store", credentials: "include" }
  );

  if (!res.ok) throw new Error("Error al obtener los miembros del grupo");
  return res.json();
}

// Obtiene los grupos a los que pertenece un atleta.
export async function getAthleteGroups(athleteId: number): Promise<GroupMemberDto[]> {
  const res = await fetch(`${API_BASE_URL}/group-members/by-athlete/${athleteId}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al obtener los grupos del atleta");
  return res.json();
}

// Añade un atleta a un grupo.
export async function joinGroup(
  groupId: number,
  athleteId: number
): Promise<GroupMemberDto> {
  const res = await fetch(
    `${API_BASE_URL}/group-members?groupId=${groupId}&athleteId=${athleteId}`,
    { method: "POST", credentials: "include" }
  );

  if (!res.ok) throw new Error("Error al unirse al grupo");
  return res.json();
}

// Elimina la relación entre el atleta y el grupo.
export async function leaveGroup(memberId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/group-members/${memberId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al salir del grupo");
}