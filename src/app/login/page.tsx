"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(username, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm overflow-hidden">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-2xl font-bold text-white">MiFinanzas</h1>
          <p className="text-accent-light text-sm mt-1">Control de gastos personales</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Ingresa tu usuario"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
