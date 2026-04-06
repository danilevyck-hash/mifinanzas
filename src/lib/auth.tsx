"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "./supabase";

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => null,
  logout: () => {},
  loading: true,
  authFetch: () => Promise.resolve(new Response()),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mifinanzas_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("mifinanzas_user");
        localStorage.removeItem("mifinanzas_token");
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("mifinanzas_user");
    localStorage.removeItem("mifinanzas_token");
  }, []);

  const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem("mifinanzas_token");
    const isFormData = options?.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...((options?.headers as Record<string, string>) || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (res.status === 401) {
      logout();
      window.location.href = "/login";
      return res;
    }
    return res;
  }, [logout]);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Error al iniciar sesion";
      const { token, ...userData } = data;
      setUser(userData);
      localStorage.setItem("mifinanzas_user", JSON.stringify(userData));
      if (token) localStorage.setItem("mifinanzas_token", token);
      return null;
    } catch {
      return "Error de conexion";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
