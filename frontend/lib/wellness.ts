export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://factoriacore.duckdns.org/api";

// Datos diarios de bienestar que rellena el atleta.
export type WellnessEntryDto = {
  id?: number;
  athlete?: {
    id: number;
  } | null;
  date: string;
  sleepHours?: number | null;
  fatigue?: number | null;
  soreness?: number | null;
  stress?: number | null;
  mood?: number | null;
  comment?: string | null;
};

// Obtiene todos los registros de bienestar disponibles.
export async function getWellness(): Promise<WellnessEntryDto[]> {
  const response = await fetch(`${API_BASE_URL}/wellness`, {
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al cargar wellness: ${response.status} - ${text}`);
  }

  const text = await response.text();
  if (!text) {
    return [];
  }

  return JSON.parse(text) as WellnessEntryDto[];
}

// Recupera el historial de bienestar de un atleta concreto.
export async function getWellnessByAthlete(
  athleteId: number
): Promise<WellnessEntryDto[]> {
  const response = await fetch(
    `${API_BASE_URL}/wellness/athlete/${athleteId}`,
    {
      credentials: "include",
    }
  );

  if (response.status === 404 || response.status === 204) {
    return [];
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error al cargar el wellness del atleta: ${response.status} - ${text}`
    );
  }

  const text = await response.text();
  if (!text) {
    return [];
  }

  return JSON.parse(text) as WellnessEntryDto[];
}

// Alias usado por las pantallas que muestran el histórico.
export async function getWellnessHistory(
  athleteId: number
): Promise<WellnessEntryDto[]> {
  return getWellnessByAthlete(athleteId);
}

// Busca si el atleta ya tiene un registro de bienestar para una fecha concreta.
export async function getWellnessForDate(
  athleteId: number,
  date: string
): Promise<WellnessEntryDto | null> {
  const response = await fetch(
    `${API_BASE_URL}/wellness/athlete/${athleteId}/date/${date}`,
    {
      credentials: "include",
    }
  );

  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error al cargar el wellness del día: ${response.status} - ${text}`
    );
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as WellnessEntryDto;
}

// Crea o actualiza el registro de bienestar enviado desde el formulario.
export async function saveWellness(
  payload: WellnessEntryDto
): Promise<WellnessEntryDto> {
  const response = await fetch(`${API_BASE_URL}/wellness`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("saveWellness failed", {
      status: response.status,
      body: text,
      payload,
    });

    throw new Error(`Error al guardar wellness: ${response.status} - ${text}`);
  }

  if (!text) {
    return payload;
  }

  return JSON.parse(text) as WellnessEntryDto;
}