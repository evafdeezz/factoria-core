"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  CurrentUser,
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
  fetchCurrentUserFromApi,
} from "@/lib/auth";

export type CurrentUserContextValue = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);

// Contexto global para tener disponible el usuario actual en toda la aplicación.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Centraliza el cambio de usuario y mantiene sincronizado el localStorage.
  const setUser = useCallback((value: CurrentUser | null) => {
    setUserState(value);

    if (value) {
      saveCurrentUser(value);
    } else {
      clearCurrentUser();
    }
  }, []);

  // Vuelve a consultar el usuario al backend y usa el guardado local como respaldo.
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const apiUser = await fetchCurrentUserFromApi();
      setUser(apiUser);
    } catch (error) {
      console.error("Error refrescando usuario actual:", error);
      const stored = getCurrentUser();
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    const stored = getCurrentUser();

    if (stored) {
      setUserState(stored);
    }

    void refreshUser();
  }, [refreshUser]);

  return (
    <CurrentUserContext.Provider
      value={{ user, setUser, loading, refreshUser }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

// Hook propio para acceder al usuario actual sin repetir useContext en cada componente.
export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);

  if (!ctx) {
    throw new Error(
      "useCurrentUser debe usarse dentro de un <CurrentUserProvider>"
    );
  }

  return ctx;
}