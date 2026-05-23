// URL base de la API. Si existe una variable de entorno, se usa esa; si no, se usa la URL de producción.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

export interface AthleteProfileDto {
  id?: number;
  birthDate?: string | null;
  sex?: string | null; // MALE | FEMALE | PREFER_NOT_TO_SAY
  discipline?: string | null;
  distanceProfile?: string | null;
  competitionCategory?: string | null;
  menstrualTrackingEnabled?: boolean;
  shareMenstrualDataWithCoach?: boolean;
  cycleLength?: number | null;
  menstrualDuration?: number | null;
  lastPeriodDate?: string | null;
  active?: boolean;
  notes?: string | null;
}

// Obtiene el perfil deportivo del usuario. Si todavía no existe, devuelve null.
export async function getAthleteProfile(
  userId: number
): Promise<AthleteProfileDto | null> {
  const res = await fetch(`${API_BASE_URL}/athletes/${userId}/profile`, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se ha podido cargar el perfil de atleta");

  return res.json();
}

// Guarda o actualiza los datos del perfil deportivo del usuario.
export async function saveAthleteProfile(
  userId: number,
  data: AthleteProfileDto
): Promise<AthleteProfileDto> {
  const res = await fetch(`${API_BASE_URL}/athletes/${userId}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error guardando athlete profile:", txt);
    throw new Error("No se ha podido guardar el perfil de atleta");
  }

  return res.json();
}