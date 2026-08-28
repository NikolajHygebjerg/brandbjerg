"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User, UserRole } from "@/lib/auth-types";
import {
  AUTH_UPDATED_EVENT,
  deleteUser,
  ensureSeedUsers,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "@/lib/auth-storage";
import { ensureAllDemoWeekData } from "@/lib/demo-seed-week";

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  login: (
    email: string,
    password: string,
  ) => { ok: true; user: User } | { ok: false; error: string };
  register: (input: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) => { ok: true; user: User } | { ok: false; error: string };
  logout: () => void;
  updateProfile: (
    patch: {
      name?: string;
      email?: string;
      role?: UserRole;
      password?: string;
    },
  ) => { ok: true; user: User } | { ok: false; error: string };
  deleteAccount: () => { ok: true } | { ok: false; error: string };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    ensureSeedUsers();
    ensureAllDemoWeekData();
    refresh();
    setHydrated(true);

    function onAuthUpdate() {
      refresh();
    }
    window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdate);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdate);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      login: (email, password) => {
        const result = loginUser(email, password);
        if (result.ok) setUser(result.user);
        return result;
      },
      register: (input) => {
        const result = registerUser(input);
        if (result.ok) setUser(result.user);
        return result;
      },
      logout: () => {
        logoutUser();
        setUser(null);
      },
      updateProfile: (patch) => {
        if (!user) return { ok: false, error: "Ikke logget ind." };
        const result = updateUser(user.id, patch);
        if (result.ok) setUser(result.user);
        return result;
      },
      deleteAccount: () => {
        if (!user) return { ok: false, error: "Ikke logget ind." };
        const result = deleteUser(user.id);
        if (result.ok) setUser(null);
        return result;
      },
    }),
    [user, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth skal bruges inden for AuthProvider");
  }
  return ctx;
}
