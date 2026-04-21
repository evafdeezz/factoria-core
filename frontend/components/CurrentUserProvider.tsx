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

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((value: CurrentUser | null) => {
    setUserState(value);

    if (value) {
      saveCurrentUser(value);
    } else {
      clearCurrentUser();
    }
  }, []);

const refreshUser = useCallback(async () => {
  try {
    setLoading(true);
    const apiUser = await fetchCurrentUserFromApi();
    setUser(apiUser); // ← delega todo a setUser, incluido el localStorage
  } catch (error) {
    console.error("Error refrescando usuario actual:", error);
    const stored = getCurrentUser();
    setUser(stored); // ← también para el fallback
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

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);

  if (!ctx) {
    throw new Error(
      "useCurrentUser debe usarse dentro de un <CurrentUserProvider>"
    );
  }

  return ctx;
}