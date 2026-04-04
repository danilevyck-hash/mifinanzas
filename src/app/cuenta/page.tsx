"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export default function CuentaPage() {
  const { user, logout, authFetch } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
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

    if (newPassword && newPassword.length < 4) {
      toast("La contrasena debe tener al menos 4 caracteres", "error");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | number> = {
        current_password: currentPassword,
      };
      if (username !== user.username) body.username = username;
      if (displayName !== user.display_name) body.display_name = displayName;
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
      <h1 className="text-xl font-semibold text-primary text-center">Mi Cuenta</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-1">Nombre</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base"
            required
          />
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Nueva Contrasena</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base"
            placeholder="Dejar vacio para no cambiar"
          />
        </div>

        {newPassword && (
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Confirmar Nueva Contrasena</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base"
              placeholder="Repite la nueva contrasena"
            />
          </div>
        )}

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Contrasena Actual *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base"
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
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
        >
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
}
