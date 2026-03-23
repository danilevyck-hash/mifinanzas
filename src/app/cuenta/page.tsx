"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function CuentaPage() {
  const { user, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!currentPassword) {
      setError("Ingresa tu contraseña actual para guardar cambios");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | number> = {
        id: user.id,
        current_password: currentPassword,
      };
      if (username !== user.username) body.username = username;
      if (displayName !== user.display_name) body.display_name = displayName;
      if (newPassword) body.new_password = newPassword;

      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Update local storage with new user data
      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      setMessage("Cambios guardados. Vuelve a iniciar sesión para ver los cambios.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // If username or password changed, logout for security
      if (username !== user.username || newPassword) {
        setTimeout(() => logout(), 1500);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-primary text-center">Mi Cuenta</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{error}</div>
        )}
        {message && (
          <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-2 text-center">{message}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Nombre</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            required
          />
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Nueva Contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            placeholder="Dejar vacío para no cambiar"
          />
        </div>

        {newPassword && (
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Repite la nueva contraseña"
            />
          </div>
        )}

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Contraseña Actual *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            placeholder="Requerida para guardar cambios"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
