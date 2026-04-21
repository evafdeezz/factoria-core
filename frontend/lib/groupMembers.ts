export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8085/api";

// Respuesta básica — solo IDs planos
export interface GroupMemberDto {
  id: number;
  groupId?: number;
  athleteId?: number;
  joinedAt?: string;
  active: boolean;
}

// Respuesta enriquecida — incluye nombre y userId del atleta
export interface GroupMemberDetailDto {
  id: number;
  groupId: number;
  athleteId: number;
  athleteUserId: number;   // User.id para rutas del coach
  athleteName: string;
  athletePicture?: string | null;
  joinedAt?: string;
  active: boolean;
}

export async function getGroupMembers(groupId: number): Promise<GroupMemberDto[]> {
  const res = await fetch(`${API_BASE_URL}/group-members/by-group/${groupId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener los miembros del grupo");
  return res.json();
}

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

export async function getAthleteGroups(athleteId: number): Promise<GroupMemberDto[]> {
  const res = await fetch(`${API_BASE_URL}/group-members/by-athlete/${athleteId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener los grupos del atleta");
  return res.json();
}

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

export async function leaveGroup(memberId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/group-members/${memberId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al salir del grupo");
}