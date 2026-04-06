"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/lib/theme";
import { Category, CategoryBudget } from "@/lib/supabase";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import CategoryEditorModal from "@/components/CategoryEditorModal";
import BulkBudgetModal from "@/components/BulkBudgetModal";
import RecurringExpensesModal from "@/components/RecurringExpensesModal";
import SavingsGoalsModal from "@/components/SavingsGoalsModal";

type Section = "perfil" | "categorias" | "presupuesto" | "recurrentes" | "metas" | "apariencia" | null;

export default function CuentaPage() {
  const { user, logout, authFetch } = useAuth();
  const { toast } = useToast();
  const { dark, toggle } = useTheme();

  const [openSection, setOpenSection] = useState<Section>(null);
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Data for modals
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [bulkBudgetOpen, setBulkBudgetOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch("/api/categories");
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setCategories(data); }
    } catch {}
  }, [user, authFetch]);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/category-budgets?month=${currentMonth}`);
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setBudgets(data); }
    } catch {}
  }, [user, authFetch, currentMonth]);

  useEffect(() => { fetchCategories(); fetchBudgets(); }, [fetchCategories, fetchBudgets]);

  if (!user) return null;

  const toggleSection = (s: Section) => setOpenSection(openSection === s ? null : s);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast("Ingresa tu contrasena actual", "error"); return; }
    if (newPassword && newPassword !== confirmPassword) { toast("Las contrasenas no coinciden", "error"); return; }
    if (newPassword && newPassword.length < 8) { toast("Minimo 8 caracteres", "error"); return; }

    setSaving(true);
    try {
      const body: Record<string, string | number> = { current_password: currentPassword };
      if (username !== user.username) body.username = username;
      if (displayName !== user.display_name) body.display_name = displayName;
      if (email !== (user.email || "")) body.email = email;
      if (newPassword) body.new_password = newPassword;

      const res = await authFetch("/api/auth/update", { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error al guardar", "error"); return; }

      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      toast("Cambios guardados");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      if (username !== user.username || newPassword) setTimeout(() => logout(), 1500);
    } catch { toast("Error de conexion", "error"); }
    finally { setSaving(false); }
  };

  const settingsItems = [
    { key: "perfil" as Section, icon: "👤", label: "Perfil", desc: "Nombre, usuario, email, contraseña" },
    { key: "categorias" as Section, icon: "🏷️", label: "Categorias", desc: `${categories.length} categorias configuradas` },
    { key: "presupuesto" as Section, icon: "💰", label: "Presupuestos", desc: "Limites mensuales por categoria" },
    { key: "recurrentes" as Section, icon: "🔄", label: "Gastos Recurrentes", desc: "Netflix, alquiler, servicios..." },
    { key: "metas" as Section, icon: "🎯", label: "Metas de Ahorro", desc: "Objetivos de ahorro personales" },
    { key: "apariencia" as Section, icon: "🎨", label: "Apariencia", desc: dark ? "Modo oscuro activado" : "Modo claro activado" },
  ];

  return (
    <div className="max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-semibold text-primary dark:text-white text-center">Configuracion</h1>

      {/* User header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5 text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">{user.display_name.charAt(0).toUpperCase()}</span>
        </div>
        <p className="text-lg font-semibold text-primary dark:text-white">{user.display_name}</p>
        <p className="text-sm text-muted dark:text-gray-400">@{user.username}</p>
      </div>

      {/* Settings list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {settingsItems.map((item, idx) => (
          <div key={item.key}>
            {idx > 0 && <div className="border-t border-gray-100 dark:border-gray-800 mx-4" />}
            <button
              onClick={() => {
                if (item.key === "categorias") setCategoryEditorOpen(true);
                else if (item.key === "presupuesto") setBulkBudgetOpen(true);
                else if (item.key === "recurrentes") setRecurringOpen(true);
                else if (item.key === "metas") setSavingsOpen(true);
                else toggleSection(item.key);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary dark:text-white">{item.label}</p>
                <p className="text-xs text-muted dark:text-gray-400 truncate">{item.desc}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Inline expandable sections */}
            {openSection === "perfil" && item.key === "perfil" && (
              <div className="px-4 pb-4 animate-fade-in">
                <form onSubmit={handleProfileSave} className="space-y-3 pt-2">
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Nombre" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Usuario" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Email (opcional)" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Nueva contrasena (dejar vacio para no cambiar)" />
                  {newPassword && (
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                      placeholder="Confirmar nueva contrasena" />
                  )}
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Contrasena actual (requerida)" />
                  <button type="submit" disabled={saving}
                    className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm min-h-[44px]">
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </form>
              </div>
            )}

            {openSection === "apariencia" && item.key === "apariencia" && (
              <div className="px-4 pb-4 animate-fade-in space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-primary dark:text-white">Modo oscuro</p>
                  <button onClick={toggle}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${dark ? "bg-accent" : "bg-gray-300"}`}>
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
                <ThemeCustomizer />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout + Privacy */}
      <button onClick={logout}
        className="w-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-500 font-medium py-3 rounded-2xl shadow-sm dark:shadow-gray-900/20 transition-colors text-sm min-h-[48px]">
        Cerrar Sesion
      </button>

      <div className="text-center pb-4">
        <a href="/privacidad" className="text-muted dark:text-gray-400 text-xs hover:underline">Politica de Privacidad</a>
      </div>

      {/* Modals */}
      <CategoryEditorModal isOpen={categoryEditorOpen} onClose={() => setCategoryEditorOpen(false)} categories={categories} onUpdated={fetchCategories} />
      <BulkBudgetModal isOpen={bulkBudgetOpen} onClose={() => setBulkBudgetOpen(false)} categories={categories} budgets={budgets} month={currentMonth} onSaved={fetchBudgets} />
      <RecurringExpensesModal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} categories={categories} />
      <SavingsGoalsModal isOpen={savingsOpen} onClose={() => setSavingsOpen(false)} />
    </div>
  );
}
