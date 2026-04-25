export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.251.152.141.nip.io:8085/api";

export type UserRole = "COACH" | "ATHLETE";

export interface UserDto {
  id: number;
  fullName: string;
  givenName?: string | null;
  familyName?: string | null;
  email: string;
  role: UserRole;
  pictureUrl?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getAllUsers(): Promise<UserDto[]> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener usuarios");
  }

  return res.json();
}

export async function getAthletes(): Promise<UserDto[]> {
  const res = await fetch(`${API_BASE_URL}/users/athletes`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener atletas");
  }

  return res.json();
}

export async function getCoaches(): Promise<UserDto[]> {
  const res = await fetch(`${API_BASE_URL}/users/coaches`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al obtener entrenadores");
  }

  return res.json();
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  birthDate?: string | null;
  role: UserRole;
  givenName?: string | null;
  familyName?: string | null;
  pictureUrl?: string | null;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  birthDate?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  pictureUrl?: string | null;
  role?: UserRole;
  active?: boolean;
}

export async function createUser(payload: CreateUserPayload): Promise<UserDto> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al crear usuario:", txt);
    throw new Error("No se pudo crear el usuario");
  }

  return res.json();
}

export async function updateUser(
  userId: number,
  payload: UpdateUserPayload
): Promise<UserDto> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Error al actualizar usuario:", txt);
    throw new Error("No se pudo actualizar el usuario");
  }
  return res.json();
}