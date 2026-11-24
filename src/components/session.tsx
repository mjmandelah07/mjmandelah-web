"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearSession, readStoredUser, readToken, saveSession } from "@/lib/api";
import type { AuthUser, LoginResponse } from "@/lib/models";

type SessionValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredUser();
    const token = readToken();
    if (!stored || !token) {
      setReady(true);
      return;
    }
    setUser(stored);
    api<AuthUser>("/auth/me")
      .then((fresh) => {
        saveSession(token, fresh);
        setUser(fresh);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const result = await api<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        saveSession(result.accessToken, result.user);
        setUser(result.user);
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session is missing");
  return value;
}
