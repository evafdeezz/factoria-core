const STORAGE_KEY = "fc_current_user";

export type UserRole = "COACH" | "ATHLETE";

export interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  pictureUrl?: string | null;
  athleteProfileId?: number | null;
}

export interface CurrentUserApiResponse {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  pictureUrl?: string | null;
  athleteProfileId?: number | null;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8085/api";

export function saveCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function fetchCurrentUserFromApi(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as CurrentUser | string;

    if (!data || typeof data === "string") {
      return null;
    }

    return {
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      pictureUrl: data.pictureUrl ?? null,
      athleteProfileId: data.athleteProfileId ?? null,
    };
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
}