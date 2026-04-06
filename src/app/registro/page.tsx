"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (!username.trim() || username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch { setUsernameAvailable(null); }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un email valido");
      return;
    }

    if (!username.trim()) {
      setError("El usuario es requerido");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, username, password, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const eyeOffIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-2xl font-bold text-white">MiFinanzas</h1>
          <p className="text-accent-light text-sm mt-1">{step === 1 ? "Crear cuenta" : "Elige tu usuario"}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Nombre</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  placeholder="Tu nombre"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  placeholder="tu@email.com"
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[#8E8E93]">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300" />
                Acepto la <a href="/privacidad" className="text-[#007AFF] underline">politica de privacidad</a>
              </label>
              <button type="button" onClick={() => {
                if (!displayName.trim()) { setError("Nombre requerido"); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Email invalido"); return; }
                if (!acceptTerms) { setError("Acepta los terminos"); return; }
                setError(""); setStep(2);
              }}
                className="w-full bg-[#007AFF] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)} className="text-[15px] text-[#007AFF] mb-2">&larr; Volver</button>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  placeholder="Elige un usuario"
                  autoFocus
                />
                {usernameAvailable === true && username.length >= 3 && (
                  <p className="text-[11px] text-green-500 mt-0.5">Usuario disponible</p>
                )}
                {usernameAvailable === false && (
                  <p className="text-[11px] text-red-500 mt-0.5">Este usuario ya existe</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Contrasena</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    placeholder="Minimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">Minimo 8 caracteres. Usa mayusculas y numeros para mayor seguridad.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Confirmar Contrasena</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    placeholder="Repite la contrasena"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007AFF] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </>
          )}
        </form>
        <div className="px-6 pb-5 text-center">
          <a href="/login" className="text-sm text-blue-500 hover:underline">
            Ya tienes cuenta? Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
