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

type ExpandableSection = "perfil" | "perfil_edit" | "seguridad" | "apariencia" | "moneda" | "formato_fecha" | "alertas" | "acerca" | null;

const CURRENCIES = [
  { code: "USD", label: "USD - Dolar Estadounidense" },
  { code: "PAB", label: "PAB - Balboa Panameno" },
  { code: "COP", label: "COP - Peso Colombiano" },
  { code: "MXN", label: "MXN - Peso Mexicano" },
  { code: "EUR", label: "EUR - Euro" },
];

export default function CuentaPage() {
  const { user, logout, authFetch } = useAuth();
  const { toast } = useToast();
  const { dark, toggle } = useTheme();

  const [expandedSection, setExpandedSection] = useState<ExpandableSection>(null);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Preferences (localStorage)
  const [currency, setCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("DD/MM");
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  // Data for modals
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [bulkBudgetOpen, setBulkBudgetOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load preferences from localStorage
  useEffect(() => {
    const prefs = localStorage.getItem("mifinanzas_prefs");
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.currency) setCurrency(p.currency);
        if (p.dateFormat) setDateFormat(p.dateFormat);
        if (p.budgetAlerts !== undefined) setBudgetAlerts(p.budgetAlerts);
      } catch {}
    }
  }, []);

  const savePrefs = (updates: Record<string, unknown>) => {
    const prefs = localStorage.getItem("mifinanzas_prefs");
    const current = prefs ? JSON.parse(prefs) : {};
    const merged = { ...current, ...updates };
    localStorage.setItem("mifinanzas_prefs", JSON.stringify(merged));
  };

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

  const toggleSection = (s: ExpandableSection) => setExpandedSection(expandedSection === s ? null : s);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string | number> = {};
      if (displayName !== user.display_name) body.display_name = displayName;
      if (email !== (user.email || "")) body.email = email;

      if (Object.keys(body).length === 0) { toast("Sin cambios"); setSaving(false); return; }

      const res = await authFetch("/api/auth/update", { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error al guardar", "error"); return; }

      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      toast("Perfil actualizado");
    } catch { toast("Error de conexion", "error"); }
    finally { setSaving(false); }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast("Ingresa tu contrasena actual", "error"); return; }
    if (newPassword && newPassword !== confirmPassword) { toast("Las contrasenas no coinciden", "error"); return; }
    if (newPassword && newPassword.length < 8) { toast("Minimo 8 caracteres", "error"); return; }

    setSaving(true);
    try {
      const body: Record<string, string | number> = { current_password: currentPassword };
      if (newPassword) body.new_password = newPassword;

      const res = await authFetch("/api/auth/update", { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error al guardar", "error"); return; }

      localStorage.setItem("mifinanzas_user", JSON.stringify(data));
      toast("Contrasena actualizada");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      if (newPassword) setTimeout(() => logout(), 1500);
    } catch { toast("Error de conexion", "error"); }
    finally { setSaving(false); }
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted dark:text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold text-muted dark:text-gray-500 uppercase tracking-wider px-1 mt-4 mb-1.5">{children}</p>
  );

  const Badge = ({ text }: { text: string }) => (
    <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-muted dark:text-gray-400 px-1.5 py-0.5 rounded-full">{text}</span>
  );

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${value ? "bg-accent" : "bg-gray-300 dark:bg-gray-600"}`}>
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  type SettingItem = {
    icon: string;
    label: string;
    desc?: string;
    expandKey?: ExpandableSection;
    onClick?: () => void;
    badge?: string;
    right?: React.ReactNode;
  };

  const renderItem = (item: SettingItem, idx: number, isLast: boolean) => (
    <div key={item.label}>
      {idx > 0 && <div className="border-t border-gray-100 dark:border-gray-800 mx-4" />}
      <button
        onClick={() => {
          if (item.onClick) item.onClick();
          else if (item.expandKey) toggleSection(item.expandKey);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-primary dark:text-white">{item.label}</p>
            {item.badge && <Badge text={item.badge} />}
          </div>
          {item.desc && <p className="text-xs text-muted dark:text-gray-400 truncate">{item.desc}</p>}
        </div>
        {item.right || (item.expandKey && <Chevron open={expandedSection === item.expandKey} />)}
        {!item.right && !item.expandKey && (
          <Chevron open={false} />
        )}
      </button>
    </div>
  );

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none";
  const btnCls = "w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm min-h-[44px]";

  return (
    <div className="max-w-md mx-auto space-y-1 pb-6">
      <h1 className="text-xl font-semibold text-primary dark:text-white text-center mb-3">Configuracion</h1>

      {/* User header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-4 flex items-center gap-3 mb-2">
        <div className="w-11 h-11 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-accent">{user.display_name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary dark:text-white truncate">{user.display_name}</p>
          <p className="text-xs text-muted dark:text-gray-400">@{user.username}</p>
        </div>
      </div>

      {/* CUENTA */}
      <SectionLabel>Cuenta</SectionLabel>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {/* Perfil */}
        {renderItem({ icon: "👤", label: "Perfil", desc: "Nombre, email", expandKey: "perfil" }, 0, false)}
        {expandedSection === "perfil" && (
          <div className="px-4 pb-4 animate-fade-in pt-2 space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted dark:text-gray-400">Nombre</span>
              <span className="text-sm text-primary dark:text-white">{user.display_name}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted dark:text-gray-400">Email</span>
              <span className="text-sm text-primary dark:text-white">{user.email || "Sin email"}</span>
            </div>
            <button onClick={() => { setDisplayName(user.display_name); setEmail(user.email || ""); setExpandedSection("perfil_edit"); }}
              className="w-full text-accent text-sm font-medium py-2 hover:text-accent-light transition-colors">
              Editar perfil
            </button>
          </div>
        )}
        {expandedSection === "perfil_edit" && (
          <div className="px-4 pb-4 animate-fade-in">
            <form onSubmit={handleProfileSave} className="space-y-3 pt-2">
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className={inputCls} placeholder="Nombre" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} placeholder="Email (opcional)" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setExpandedSection("perfil")}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-primary dark:text-white font-medium py-2.5 rounded-xl text-sm min-h-[44px]">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm min-h-[44px]">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Seguridad */}
        {renderItem({ icon: "🔒", label: "Seguridad", desc: "Usuario y contrasena", expandKey: "seguridad" }, 1, false)}
        {expandedSection === "seguridad" && (
          <div className="px-4 pb-4 animate-fade-in">
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <span className="text-xs text-muted dark:text-gray-400">Usuario de acceso:</span>
                <span className="text-sm font-medium text-primary dark:text-white">@{user.username}</span>
              </div>
              <form onSubmit={handleSecuritySave} className="space-y-3">
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputCls} placeholder="Contrasena actual" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls} placeholder="Nueva contrasena" />
                {newPassword && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-full rounded-full transition-all ${
                        newPassword.length >= 12 || /[A-Z].*[0-9]|[0-9].*[A-Z]/.test(newPassword)
                          ? "w-full bg-green-500"
                          : newPassword.length >= 8
                            ? "w-2/3 bg-amber-500"
                            : "w-1/3 bg-red-500"
                      }`} />
                    </div>
                    <span className={`text-xs ${
                      newPassword.length >= 12 || /[A-Z].*[0-9]|[0-9].*[A-Z]/.test(newPassword)
                        ? "text-green-500"
                        : newPassword.length >= 8
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}>
                      {newPassword.length >= 12 || /[A-Z].*[0-9]|[0-9].*[A-Z]/.test(newPassword) ? "Fuerte" : newPassword.length >= 8 ? "Media" : "Muy corta"}
                    </span>
                  </div>
                )}
                {newPassword && (
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputCls} placeholder="Confirmar nueva contrasena" />
                )}
                <button type="submit" disabled={saving} className={btnCls}>
                  {saving ? "Guardando..." : "Cambiar contrasena"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Eliminar cuenta */}
        <div>
          <div className="border-t border-gray-100 dark:border-gray-800 mx-4" />
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <span className="text-lg w-7 text-center flex-shrink-0">🗑️</span>
            <p className="text-sm font-medium text-red-500 flex-1">Eliminar cuenta</p>
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary dark:text-white mb-2">Eliminar cuenta</h3>
            <p className="text-sm text-muted dark:text-gray-400 mb-4">Esta accion es irreversible. Se eliminaran todos tus datos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-primary dark:text-white font-medium py-2.5 rounded-xl text-sm min-h-[44px]">
                Cancelar
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); toast("Contacta soporte para eliminar tu cuenta", "error"); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm min-h-[44px]">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINANZAS */}
      <SectionLabel>Finanzas</SectionLabel>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {renderItem({ icon: "🏷️", label: "Categorias", desc: `${categories.length} categorias configuradas`, onClick: () => setCategoryEditorOpen(true) }, 0, false)}
        {renderItem({ icon: "💰", label: "Presupuestos", desc: `${budgets.length} de ${categories.length} con presupuesto`, onClick: () => setBulkBudgetOpen(true) }, 1, false)}
        {renderItem({ icon: "🔄", label: "Gastos Recurrentes", desc: "Gastos que se repiten cada mes", onClick: () => setRecurringOpen(true) }, 2, false)}
        {renderItem({ icon: "🎯", label: "Metas de Ahorro", desc: "Configura tus metas de ahorro", onClick: () => setSavingsOpen(true) }, 3, true)}
      </div>

      {/* PREFERENCIAS */}
      <SectionLabel>Preferencias</SectionLabel>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {/* Apariencia */}
        {renderItem({ icon: "🎨", label: "Apariencia", desc: dark ? "Modo oscuro activado" : "Modo claro activado", expandKey: "apariencia" }, 0, false)}
        {expandedSection === "apariencia" && (
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

        {/* Moneda */}
        {renderItem({ icon: "💲", label: "Moneda", desc: currency, expandKey: "moneda" }, 1, false)}
        {expandedSection === "moneda" && (
          <div className="px-4 pb-4 animate-fade-in pt-2">
            <div className="space-y-1">
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => { setCurrency(c.code); savePrefs({ currency: c.code }); toast(`Moneda: ${c.code}`); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${currency === c.code ? "bg-accent/10 text-accent font-medium" : "text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formato de fecha */}
        {renderItem({ icon: "📅", label: "Formato de fecha", desc: dateFormat === "DD/MM" ? "DD/MM/YYYY" : "MM/DD/YYYY", expandKey: "formato_fecha" }, 2, false)}
        {expandedSection === "formato_fecha" && (
          <div className="px-4 pb-4 animate-fade-in pt-2 space-y-2">
            {[{ v: "DD/MM", l: "DD/MM/YYYY (31/12/2025)" }, { v: "MM/DD", l: "MM/DD/YYYY (12/31/2025)" }].map((f) => (
              <button key={f.v} onClick={() => { setDateFormat(f.v); savePrefs({ dateFormat: f.v }); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${dateFormat === f.v ? "bg-accent/10 text-accent font-medium" : "text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {f.l}
              </button>
            ))}
          </div>
        )}

        {/* Alertas */}
        {renderItem({ icon: "📊", label: "Alertas de presupuesto", desc: "Notificaciones al 80% y 100% del presupuesto", expandKey: "alertas", right: (
          <ToggleSwitch value={budgetAlerts} onChange={(v) => { setBudgetAlerts(v); savePrefs({ budgetAlerts: v }); }} />
        ) }, 3, false)}


      </div>

      {/* INFO */}
      <SectionLabel>Info</SectionLabel>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
        {renderItem({ icon: "📋", label: "Acerca de", expandKey: "acerca" }, 0, true)}
        {expandedSection === "acerca" && (
          <div className="px-4 pb-4 animate-fade-in pt-2">
            <div className="space-y-1 text-sm text-muted dark:text-gray-400">
              <p><span className="font-medium text-primary dark:text-white">MiFinanzas</span> v1.0.0</p>
              <p>Hecho en Panama 🇵🇦</p>
              <p className="mt-2">
                <a href="mailto:soporte@mifinanzas.app" className="text-accent hover:underline">Enviar feedback</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button onClick={logout}
          className="w-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-500 font-medium py-3 rounded-2xl shadow-sm dark:shadow-gray-900/20 transition-colors text-sm min-h-[48px]">
          Cerrar Sesion
        </button>
      </div>

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
