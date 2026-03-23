"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "./supabase";

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => null,
  logout: () => {},
  loading: true,
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
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Error al iniciar sesión";
      setUser(data);
      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      return null;
    } catch {
      return "Error de conexión";
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mifinanzas_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
