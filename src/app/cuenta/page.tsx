"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/lib/theme";

export default function CuentaPage() {
  const { user, logout, authFetch } = useAuth();
  const { toast } = useToast();
  const { dark, toggle } = useTheme();
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast("Ingresa tu contrasena actual para guardar cambios", "error");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast("Las contrasenas nuevas no coinciden", "error");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast("La contrasena debe tener al menos 8 caracteres", "error");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | number> = {
        current_password: currentPassword,
      };
      if (username !== user.username) body.username = username;
      if (displayName !== user.display_name) body.display_name = displayName;
      if (email !== (user.email || "")) body.email = email;
      if (newPassword) body.new_password = newPassword;

      const res = await authFetch("/api/auth/update", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Error al guardar", "error");
        return;
      }

      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      toast("Cambios guardados");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (username !== user.username || newPassword) {
        setTimeout(() => logout(), 1500);
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-primary dark:text-white text-center">Mi Cuenta</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary dark:text-white">Modo oscuro</p>
          <p className="text-xs text-muted dark:text-gray-400">Cambiar apariencia de la app</p>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${dark ? "bg-accent" : "bg-gray-300 dark:bg-gray-600"}`}
        >
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${dark ? "translate-x-6" : "translate-x-1"}`}>
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary dark:text-white mb-1">Nombre</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary dark:text-white mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary dark:text-white mb-1">Email (opcional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
            placeholder="tu@email.com"
          />
        </div>

        <hr className="border-gray-100 dark:border-gray-700" />

        <div>
          <label className="block text-sm font-medium text-primary dark:text-white mb-1">Nueva Contrasena</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
            placeholder="Dejar vacio para no cambiar"
          />
        </div>

        {newPassword && (
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Confirmar Nueva Contrasena</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="Repite la nueva contrasena"
            />
          </div>
        )}

        <hr className="border-gray-100 dark:border-gray-700" />

        <div>
          <label className="block text-sm font-medium text-primary dark:text-white mb-1">Contrasena Actual *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
            placeholder="Requerida para guardar cambios"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {/* Logout button - visible on mobile where bottom nav doesn't have it */}
      <div className="sm:hidden">
        <button
          onClick={logout}
          className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
        >
          Cerrar Sesion
        </button>
      </div>

      <div className="text-center">
        <a href="/privacidad" className="text-muted text-xs hover:underline">Politica de Privacidad</a>
      </div>
    </div>
  );
}
