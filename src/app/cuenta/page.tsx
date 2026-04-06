"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/lib/theme";
import { Category, CategoryBudget } from "@/lib/supabase";
import CategoryEditorModal from "@/components/CategoryEditorModal";
import BulkBudgetModal from "@/components/BulkBudgetModal";
import RecurringExpensesModal from "@/components/RecurringExpensesModal";
import SavingsGoalsModal from "@/components/SavingsGoalsModal";

type Section = "perfil_edit" | "seguridad" | "moneda" | "formato_fecha" | null;

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "Dolar (USD)" },
  { code: "PAB", symbol: "B/.", label: "Balboa (PAB)" },
  { code: "COP", symbol: "$", label: "Peso Colombiano (COP)" },
  { code: "MXN", symbol: "$", label: "Peso Mexicano (MXN)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
];

export default function CuentaPage() {
  const { user, logout, authFetch, refreshUser } = useAuth();
  const { toast } = useToast();
  const { dark, toggle } = useTheme();

  const [openSection, setOpenSection] = useState<Section>(null);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [currency, setCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("DD/MM");
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [bulkBudgetOpen, setBulkBudgetOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

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
    const current = JSON.parse(localStorage.getItem("mifinanzas_prefs") || "{}");
    localStorage.setItem("mifinanzas_prefs", JSON.stringify({ ...current, ...updates }));
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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {};
    if (displayName !== user.display_name) body.display_name = displayName;
    if (email !== (user.email || "")) body.email = email;
    if (Object.keys(body).length === 0) { toast("Sin cambios"); return; }
    setSaving(true);
    try {
      const res = await authFetch("/api/auth/update", { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error", "error"); return; }
      refreshUser(data);
      toast("Guardado");
      setOpenSection(null);
    } catch { toast("Error de conexion", "error"); }
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast("Ingresa tu contrasena actual", "error"); return; }
    if (!newPassword || newPassword.length < 8) { toast("Minimo 8 caracteres", "error"); return; }
    if (newPassword !== confirmPassword) { toast("No coinciden", "error"); return; }
    setSaving(true);
    try {
      const res = await authFetch("/api/auth/update", { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Error", "error"); return; }
      toast("Contrasena actualizada. Cerrando sesion...");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setOpenSection(null);
      setTimeout(() => logout(), 2000);
    } catch { toast("Error de conexion", "error"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  const Cell = ({ label, value, onClick, destructive, toggle: toggleVal, onToggle }: {
    label: string; value?: string; onClick?: () => void; destructive?: boolean;
    toggle?: boolean; onToggle?: (v: boolean) => void;
  }) => (
    <button
      onClick={() => { if (onToggle) onToggle(!toggleVal); else if (onClick) onClick(); }}
      className={`w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-left ${onClick || onToggle ? "active:bg-gray-100 dark:active:bg-gray-800" : ""}`}
    >
      <span className={`text-[15px] ${destructive ? "text-red-500" : "text-primary dark:text-white"}`}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-[15px] text-muted dark:text-gray-400">{value}</span>}
        {toggleVal !== undefined && onToggle && (
          <div className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors ${toggleVal ? "bg-[#34C759]" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${toggleVal ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
          </div>
        )}
        {onClick && !value && !destructive && (
          <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
        {value && onClick && (
          <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );

  const Divider = () => <div className="border-t border-gray-200/60 dark:border-gray-700/60 ml-4" />;
  const SectionHeader = ({ children }: { children: string }) => (
    <p className="text-[13px] text-muted dark:text-gray-500 uppercase px-4 pt-5 pb-1.5">{children}</p>
  );

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden mb-6">
        <button
          onClick={() => { setDisplayName(user.display_name); setEmail(user.email || ""); setOpenSection(openSection === "perfil_edit" ? null : "perfil_edit"); }}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-gray-500 dark:text-gray-300">{user.display_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold text-primary dark:text-white truncate">{user.display_name}</p>
            <p className="text-[13px] text-muted dark:text-gray-400">{user.email || `@${user.username}`}</p>
          </div>
          <svg className={`h-4 w-4 text-gray-300 dark:text-gray-600 transition-transform ${openSection === "perfil_edit" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Inline edit */}
        {openSection === "perfil_edit" && (
          <div className="border-t border-gray-200/60 dark:border-gray-700/60 px-5 py-4 animate-fade-in">
            <form onSubmit={handleProfileSave} className="space-y-3">
              <div>
                <label className="text-[13px] text-muted dark:text-gray-400 block mb-1">Nombre</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[13px] text-muted dark:text-gray-400 block mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="tu@email.com" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpenSection(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-primary dark:text-white font-medium py-2.5 rounded-xl text-[15px]">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-[15px]">
                  {saving ? "..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Finanzas */}
      <SectionHeader>Finanzas</SectionHeader>
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        <Cell label="Categorias" value={`${categories.length}`} onClick={() => setCategoryEditorOpen(true)} />
        <Divider />
        <Cell label="Presupuestos" value={`${budgets.length} de ${categories.length}`} onClick={() => setBulkBudgetOpen(true)} />
        <Divider />
        <Cell label="Gastos recurrentes" onClick={() => setRecurringOpen(true)} />
        <Divider />
        <Cell label="Metas de ahorro" onClick={() => setSavingsOpen(true)} />
      </div>

      {/* Preferencias */}
      <SectionHeader>Preferencias</SectionHeader>
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        <Cell label="Modo oscuro" toggle={dark} onToggle={toggle} />
        <Divider />
        <Cell label="Moneda" value={currency} onClick={() => setOpenSection(openSection === "moneda" ? null : "moneda")} />
        {openSection === "moneda" && (
          <div className="px-4 pb-3 animate-fade-in">
            {CURRENCIES.map((c) => (
              <button key={c.code} onClick={() => { setCurrency(c.code); savePrefs({ currency: c.code }); setOpenSection(null); toast(`Moneda: ${c.code}`); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] text-primary dark:text-white">
                <span>{c.label}</span>
                {currency === c.code && (
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <Divider />
        <Cell label="Formato de fecha" value={dateFormat === "DD/MM" ? "DD/MM" : "MM/DD"} onClick={() => setOpenSection(openSection === "formato_fecha" ? null : "formato_fecha")} />
        {openSection === "formato_fecha" && (
          <div className="px-4 pb-3 animate-fade-in">
            {[{ v: "DD/MM", l: "31/12/2025" }, { v: "MM/DD", l: "12/31/2025" }].map((f) => (
              <button key={f.v} onClick={() => { setDateFormat(f.v); savePrefs({ dateFormat: f.v }); setOpenSection(null); toast("Formato actualizado"); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] text-primary dark:text-white">
                <span>{f.l}</span>
                {dateFormat === f.v && (
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <Divider />
        <Cell label="Alertas de presupuesto" toggle={budgetAlerts} onToggle={(v) => { setBudgetAlerts(v); savePrefs({ budgetAlerts: v }); toast(v ? "Alertas activadas" : "Alertas desactivadas"); }} />
      </div>

      {/* Seguridad */}
      <SectionHeader>Seguridad</SectionHeader>
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        <Cell label="Cambiar contrasena" onClick={() => setOpenSection(openSection === "seguridad" ? null : "seguridad")} />
        {openSection === "seguridad" && (
          <div className="px-4 pb-4 animate-fade-in">
            <form onSubmit={handlePasswordSave} className="space-y-3 pt-1">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} placeholder="Contrasena actual" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Nueva contrasena" />
              {newPassword && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-full rounded-full transition-all ${
                        newPassword.length >= 12 || /[A-Z].*[0-9]|[0-9].*[A-Z]/.test(newPassword) ? "w-full bg-[#34C759]" : newPassword.length >= 8 ? "w-2/3 bg-amber-500" : "w-1/3 bg-red-500"
                      }`} />
                    </div>
                    <span className="text-[11px] text-muted dark:text-gray-400">
                      {newPassword.length >= 12 || /[A-Z].*[0-9]|[0-9].*[A-Z]/.test(newPassword) ? "Fuerte" : newPassword.length >= 8 ? "Media" : "Debil"}
                    </span>
                  </div>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Confirmar" />
                </>
              )}
              <button type="submit" disabled={saving}
                className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-[15px]">
                {saving ? "..." : "Actualizar"}
              </button>
            </form>
          </div>
        )}
        <Divider />
        <Cell label="Eliminar cuenta" destructive onClick={() => setShowDeleteConfirm(true)} />
      </div>

      {/* Footer */}
      <div className="mt-8 mb-2">
        <button onClick={logout}
          className="w-full bg-white dark:bg-gray-900 text-red-500 font-medium py-3 rounded-2xl text-[15px]">
          Cerrar sesion
        </button>
      </div>

      <div className="text-center space-y-1 py-4">
        <p className="text-[11px] text-gray-400 dark:text-gray-600">MiFinanzas v1.0.0</p>
        <a href="/privacidad" className="text-[11px] text-gray-400 dark:text-gray-600 hover:underline">Politica de privacidad</a>
      </div>

      {/* Delete dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-2xl w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <h3 className="text-[17px] font-semibold text-primary dark:text-white">Eliminar cuenta</h3>
              <p className="text-[13px] text-muted dark:text-gray-400 mt-2">Se eliminaran todos tus datos permanentemente. Esta accion no se puede deshacer.</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button onClick={async () => {
                setShowDeleteConfirm(false);
                const res = await authFetch("/api/auth/update", { method: "DELETE" });
                if (res.ok) { logout(); }
                else { toast("Error al eliminar", "error"); }
              }}
                className="w-full py-3 text-[17px] text-red-500 font-medium border-b border-gray-200 dark:border-gray-700">
                Eliminar
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3 text-[17px] text-blue-500 font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryEditorModal isOpen={categoryEditorOpen} onClose={() => setCategoryEditorOpen(false)} categories={categories} onUpdated={fetchCategories} />
      <BulkBudgetModal isOpen={bulkBudgetOpen} onClose={() => setBulkBudgetOpen(false)} categories={categories} budgets={budgets} month={currentMonth} onSaved={fetchBudgets} />
      <RecurringExpensesModal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} categories={categories} />
      <SavingsGoalsModal isOpen={savingsOpen} onClose={() => setSavingsOpen(false)} />
    </div>
  );
}
