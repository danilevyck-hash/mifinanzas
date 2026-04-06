"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code" | "password";

export default function RecuperarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar el codigo");
        return;
      }
      setStep("code");
      setSuccess("Si el email esta registrado, recibiras un codigo");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("El codigo debe tener 6 digitos");
      return;
    }
    setStep("password");
    setSuccess("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar la contrasena");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    email: "Recuperar Contrasena",
    code: "Verificar Codigo",
    password: "Nueva Contrasena",
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 w-full max-w-sm overflow-hidden">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-2xl font-bold text-white">MiFinanzas</h1>
          <p className="text-accent-light text-sm mt-1">{stepTitle[step]}</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-2 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-2 text-center">
              {success}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow bg-white dark:bg-gray-800 text-primary dark:text-white"
                  placeholder="tu@email.com"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted dark:text-gray-400">
                Te enviaremos un codigo de 6 digitos a tu email.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors min-h-[48px]"
              >
                {loading ? "Enviando..." : "Enviar Codigo"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Codigo de verificacion</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow bg-white dark:bg-gray-800 text-primary dark:text-white text-center text-2xl tracking-[0.5em]"
                  placeholder="000000"
                  required
                  autoFocus
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted dark:text-gray-400">
                Revisa tu email e ingresa el codigo de 6 digitos.
              </p>
              <button
                type="submit"
                disabled={code.length !== 6}
                className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors min-h-[48px]"
              >
                Verificar
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Nueva contrasena</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow bg-white dark:bg-gray-800 text-primary dark:text-white"
                  placeholder="Minimo 8 caracteres"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary dark:text-white mb-1">Confirmar contrasena</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow bg-white dark:bg-gray-800 text-primary dark:text-white"
                  placeholder="Repite la contrasena"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors min-h-[48px]"
              >
                {loading ? "Cambiando..." : "Cambiar Contrasena"}
              </button>
            </form>
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <a href="/login" className="text-sm text-accent hover:underline">
            Volver al inicio de sesion
          </a>
        </div>
      </div>
    </div>
  );
}
