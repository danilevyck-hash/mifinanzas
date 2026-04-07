"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PersonalExpense, Category, CategoryBudget, getCategoryIcon } from "@/lib/supabase";
import { formatCurrency, formatDate, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ExpenseModal from "@/components/ExpenseModal";
import ExportModal from "@/components/ExportModal";
import ConfirmModal from "@/components/ConfirmModal";
import { KPISkeleton, CategorySkeleton } from "@/components/SkeletonLoader";

import { usePreferences } from "@/lib/usePreferences";
import React from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted dark:text-gray-400">Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { toast } = useToast();
  const { prefs, updatePrefs } = usePreferences();
  const paramMonth = searchParams.get("month");
  const paramYear = searchParams.get("year");

  const now = new Date();
  const viewMonth = paramMonth !== null ? parseInt(paramMonth) : now.getMonth();
  const viewYear = paramYear !== null ? parseInt(paramYear) : now.getFullYear();
  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalExpense | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [alertsShown, setAlertsShown] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);

  const viewMonthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch {
      toast("Error de conexion", "error");
    }
  }, [user, authFetch, toast]);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/category-budgets?month=${viewMonthStr}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBudgets(data);
      }
    } catch {
      toast("Error de conexion", "error");
    }
  }, [user, authFetch, viewMonthStr, toast]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/personal-expenses?from=${dateFrom}&to=${dateTo}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setExpenses(data);
      }
    } catch {
      toast("Error de conexion", "error");
    }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, user, authFetch, toast]);

  useEffect(() => { setLoading(true); fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchBudgets(); setAlertsShown(false); }, [fetchBudgets]);

  const recurringApplied = useRef(false);
  useEffect(() => {
    if (!user || !isCurrentMonth || recurringApplied.current) return;
    recurringApplied.current = true;
    (async () => {
      try {
        const res = await authFetch("/api/recurring-expenses/apply", {
          method: "POST",
          body: JSON.stringify({ month: viewMonthStr }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.created > 0) {
            await fetchExpenses();
            toast(`Se aplicaron ${data.created} gasto(s) recurrente(s)`, "success");
          }
        }
      } catch {
        // silent — recurring apply is best-effort
      }
    })();
  }, [user, isCurrentMonth, viewMonthStr, authFetch, fetchExpenses, toast]);

  const totalMonth = expenses.reduce((sum, e) => sum + e.amount, 0);

  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const fetchAllExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/personal-expenses`);
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setAllExpenses(data); }
    } catch {
      toast("Error de conexion", "error");
    }
  }, [user, authFetch, toast]);
  useEffect(() => { fetchAllExpenses(); }, [fetchAllExpenses]);

  const handleSave = async (expense: Partial<PersonalExpense>) => {
    setSaving(true);
    try {
      const method = expense.id ? "PUT" : "POST";
      const res = await authFetch("/api/personal-expenses", { method, body: JSON.stringify(expense) });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
        return;
      }
      setModalOpen(false);
      setEditing(null);
      toast(expense.id ? "Gasto actualizado" : "Gasto agregado");
      // Save last used category and payment method
      if (expense.category || expense.payment_method) {
        updatePrefs({ last_category: expense.category, last_payment_method: expense.payment_method });
      }
      // Check budget alert for this category after save
      if (expense.category && expense.date) {
        const expenseMonth = expense.date.substring(0, 7);
        if (expenseMonth === viewMonthStr) {
          const budget = budgetMap[expense.category];
          if (budget && budget > 0) {
            const currentTotal = expenses
              .filter((e) => e.category === expense.category)
              .reduce((sum, e) => sum + e.amount, 0);
            const newTotal = expense.id
              ? currentTotal - (editing?.amount || 0) + (expense.amount || 0)
              : currentTotal + (expense.amount || 0);
            const pct = (newTotal / budget) * 100;
            if (pct >= 100) {
              toast(`\u{1F6A8} ${expense.category}: Presupuesto agotado — ${formatCurrency(newTotal)} de ${formatCurrency(budget)}`, "danger");
            } else if (pct >= 80) {
              toast(`\u26A0\uFE0F ${expense.category}: Llevas ${formatCurrency(newTotal)} de ${formatCurrency(budget)} (${Math.round(pct)}%)`, "warning");
            }
          }
        }
      }
      fetchExpenses();
      fetchAllExpenses();
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      const res = await authFetch("/api/personal-expenses", { method: "DELETE", body: JSON.stringify({ id }) });
      if (!res.ok) {
        toast("Error al eliminar", "error");
        return;
      }
      toast("Gasto eliminado");
      fetchExpenses();
      fetchAllExpenses();
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (expense: PersonalExpense) => {
    const today = new Date().toISOString().split("T")[0];
    const dup = {
      user_id: expense.user_id,
      date: today,
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes,
      payment_method: expense.payment_method,
    };
    try {
      const res = await authFetch("/api/personal-expenses", { method: "POST", body: JSON.stringify(dup) });
      if (res.ok) {
        toast("Gasto duplicado");
        fetchExpenses();
        fetchAllExpenses();
      } else {
        toast("Error al duplicar", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    }
  };

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.name] = c.color; });
    return map;
  }, [categories]);

  const iconMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { if (c.icon) map[c.name] = c.icon; });
    return map;
  }, [categories]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, total]) => ({
        name, total,
        pct: totalMonth > 0 ? (total / totalMonth) * 100 : 0,
        color: colorMap[name] || "#6B7280",
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalMonth, colorMap]);

  const budgetMap = useMemo(() => {
    const map: Record<string, number> = {};
    budgets.forEach((b) => { map[b.category] = b.budget_amount; });
    return map;
  }, [budgets]);

  // Sorted categories: with budget (by % usage desc) first, without budget last
  const sortedCategoryData = useMemo(() => {
    const withBudget = categoryData
      .filter((cat) => budgetMap[cat.name] != null && budgetMap[cat.name] > 0)
      .sort((a, b) => {
        const pctA = (a.total / budgetMap[a.name]) * 100;
        const pctB = (b.total / budgetMap[b.name]) * 100;
        return pctB - pctA;
      });
    const withoutBudget = categoryData.filter((cat) => !budgetMap[cat.name] || budgetMap[cat.name] <= 0);
    return [...withBudget, ...withoutBudget];
  }, [categoryData, budgetMap]);

  // Feature 1 — Budget KPIs
  const budgetTotal = useMemo(() => budgets.reduce((sum, b) => sum + b.budget_amount, 0), [budgets]);
  const hasBudgets = budgets.length > 0 && budgetTotal > 0;
  const daysInMonth = lastDay;
  const daysPassed = isCurrentMonth ? now.getDate() : lastDay;
  const daysRemaining = isCurrentMonth ? Math.max(daysInMonth - now.getDate(), 0) : 0;
  const spentPct = budgetTotal > 0 ? (totalMonth / budgetTotal) * 100 : 0;
  const available = budgetTotal - totalMonth;

  // Projection — daily avg × days in month
  const dailyAvg = daysPassed > 0 ? totalMonth / daysPassed : 0;
  const projected = dailyAvg * daysInMonth;

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const method = e.payment_method || "Otro";
      map[method] = (map[method] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Feature 3 — Trends (vs previous month, same period)
  const prevMonthData = useMemo(() => {
    let pm = viewMonth - 1;
    let py = viewYear;
    if (pm < 0) { pm = 11; py--; }
    const prefix = `${py}-${String(pm + 1).padStart(2, "0")}`;
    const prevExpenses = allExpenses.filter((e) => e.date.startsWith(prefix));

    // Compare same period: only include expenses up to the same day of month
    const currentDay = isCurrentMonth ? now.getDate() : lastDay;
    const prevSamePeriod = prevExpenses.filter((e) => {
      const day = parseInt(e.date.split("-")[2], 10);
      return day <= currentDay;
    });

    const prevTotal = prevSamePeriod.reduce((sum, e) => sum + e.amount, 0);
    return { total: prevTotal, hasData: prevExpenses.length > 0 };
  }, [allExpenses, viewMonth, viewYear, isCurrentMonth, now, lastDay]);


  // Budget alerts — once per day max
  useEffect(() => {
    if (alertsShown || categoryData.length === 0 || budgets.length === 0) return;
    if (typeof window !== "undefined") {
      try {
        const prefs = JSON.parse(localStorage.getItem("mifinanzas_prefs") || "{}");
        if (prefs.budgetAlerts === false) { setAlertsShown(true); return; }
      } catch {}
    }
    const today = new Date().toISOString().split("T")[0];
    const lastAlert = localStorage.getItem("mifinanzas_alerts_date");
    if (lastAlert === today) { setAlertsShown(true); return; }
    setAlertsShown(true);
    localStorage.setItem("mifinanzas_alerts_date", today);
    let count = 0;
    for (const cat of sortedCategoryData) {
      const budget = budgetMap[cat.name];
      if (!budget || budget <= 0) continue;
      const pct = (cat.total / budget) * 100;
      if (pct >= 100 && count < 3) {
        toast(`\u{1F6A8} ${cat.name}: Presupuesto agotado — ${formatCurrency(cat.total)} de ${formatCurrency(budget)}`, "danger");
        count++;
      } else if (pct >= 80 && count < 3) {
        toast(`\u26A0\uFE0F ${cat.name}: Llevas ${formatCurrency(cat.total)} de ${formatCurrency(budget)} (${Math.round(pct)}%)`, "warning");
        count++;
      }
    }
  }, [alertsShown, categoryData, sortedCategoryData, budgets, budgetMap, toast]);

  // FAB hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setFabVisible(currentY < lastScrollY.current || currentY < 100);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter((e) =>
      (e.notes && e.notes.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q) ||
      e.payment_method.toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, PersonalExpense[]> = {};
    filteredExpenses.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
        total: items.reduce((sum, e) => sum + e.amount, 0),
      }));
  }, [filteredExpenses]);

  const allFilteredExpenses = useMemo(() => groupedExpenses.flatMap(g => g.items), [groupedExpenses]);
  const visibleExpenses = useMemo(() => allFilteredExpenses.slice(0, visibleCount), [allFilteredExpenses, visibleCount]);
  const hasMore = allFilteredExpenses.length > visibleCount;

  const visibleGroups = useMemo(() => {
    const groups: Record<string, PersonalExpense[]> = {};
    visibleExpenses.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({
      date, items, total: items.reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [visibleExpenses]);

  const navigateMonth = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setVisibleCount(15);
    router.push(`/?month=${m}&year=${y}`);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  if (!user) return null;

  return (
    <>
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => navigateMonth(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Mes anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center min-w-[180px]">
          <h1 className="text-xl font-semibold text-primary dark:text-white flex items-center justify-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
            {isCurrentMonth && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1.5 animate-pulse" />}
          </h1>
          {!isCurrentMonth && (
            <button onClick={() => router.push("/")} className="text-xs text-blue-500 hover:text-blue-600 transition-colors">
              Ir al mes actual
            </button>
          )}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Mes siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <KPISkeleton />
      ) : (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
          {/* Main amount */}
          <div className="px-5 pt-5 pb-3 text-center">
            <p className={`text-[34px] font-bold leading-tight tabular-nums ${hasBudgets && spentPct >= 100 ? "text-red-500" : hasBudgets && spentPct >= 80 ? "text-amber-500" : "text-primary dark:text-white"}`}>
              {formatCurrency(totalMonth)}
            </p>
            <p className="text-[13px] text-[#8E8E93] mt-1">
              {hasBudgets
                ? `de ${formatCurrency(budgetTotal)} · quedan ${formatCurrency(Math.max(available, 0))}`
                : `${expenses.length} gasto${expenses.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>

          {/* Mini KPIs row */}
          {(prevMonthData.hasData || (isCurrentMonth && daysPassed > 0 && expenses.length > 0)) && (
            <div className="border-t border-[#C6C6C8]/20 dark:border-gray-800 grid grid-cols-2 divide-x divide-[#C6C6C8]/20 dark:divide-gray-800">
              {/* vs mes anterior (mismo periodo) */}
              {prevMonthData.hasData && prevMonthData.total > 0 ? (() => {
                const diff = totalMonth - prevMonthData.total;
                const changePct = (diff / prevMonthData.total) * 100;
                const isMore = diff > 0;
                return (
                  <div className="px-4 py-3 text-center">
                    <p className="text-[11px] text-[#8E8E93] uppercase">vs mes anterior</p>
                    <p className={`text-[17px] font-semibold mt-0.5 tabular-nums ${isMore ? "text-red-500" : "text-green-500"}`}>
                      {isMore ? "+" : ""}{Math.round(changePct)}%
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">al dia {daysPassed}</p>
                  </div>
                );
              })() : (
                <div className="px-4 py-3 text-center">
                  <p className="text-[11px] text-[#8E8E93] uppercase">vs mes anterior</p>
                  <p className="text-[15px] text-[#8E8E93] mt-0.5">—</p>
                </div>
              )}

              {/* Proyeccion */}
              {isCurrentMonth && daysPassed > 0 && expenses.length > 0 ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-[11px] text-[#8E8E93] uppercase">Proyeccion</p>
                  <p className={`text-[17px] font-semibold mt-0.5 tabular-nums ${hasBudgets && projected > budgetTotal ? "text-red-500" : "text-primary dark:text-white"}`}>
                    {formatCurrency(projected)}
                  </p>
                  <p className="text-[11px] text-[#8E8E93]">fin de mes</p>
                </div>
              ) : (
                <div className="px-4 py-3 text-center">
                  <p className="text-[11px] text-[#8E8E93] uppercase">Dias restantes</p>
                  <p className="text-[17px] font-semibold mt-0.5 tabular-nums text-primary dark:text-white">
                    {daysRemaining}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category breakdown — collapsible cells */}
      {loading ? (
        <CategorySkeleton />
      ) : categoryData.length > 0 ? (
        <div>
          <p className="text-[13px] font-medium text-[#8E8E93] uppercase px-1 mb-2">Por Categoria</p>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4">
            {sortedCategoryData.map((cat, idx) => {
              const budget = budgetMap[cat.name];
              const hasBudget = budget != null && budget > 0;
              const budgetPct = hasBudget ? (cat.total / budget) * 100 : 0;
              const budgetBarColor = budgetPct >= 100 ? "#ef4444" : budgetPct >= 80 ? "#f59e0b" : "#1e3a5f";
              const remaining = hasBudget ? budget - cat.total : 0;

              return (
                <div key={cat.name} className={idx > 0 ? "border-t border-[#C6C6C8]/20 dark:border-gray-800 ml-6 -mx-0" : ""}>
                  <div className={idx > 0 ? "-ml-6" : ""}>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-[15px] text-primary dark:text-white">{iconMap[cat.name] || getCategoryIcon(cat.name)} {cat.name}</span>
                      </div>
                      <span className="text-[15px] tabular-nums text-primary dark:text-white">{formatCurrency(cat.total)}</span>
                    </div>
                    {hasBudget && (
                      <div className="pb-2">
                        <div className="w-full bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full h-1.5 overflow-hidden mb-1">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetBarColor }} />
                        </div>
                        <p className="text-[11px] text-[#8E8E93]">
                          {formatCurrency(cat.total)} de {formatCurrency(budget)} — {budgetPct >= 100 ? "por encima" : `quedan ${formatCurrency(remaining)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Payment method breakdown */}
      {!loading && paymentMethodData.length > 1 && (
        <div>
          <p className="text-[13px] font-medium text-[#8E8E93] uppercase px-1 mb-2">Por Metodo de Pago</p>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4">
            {paymentMethodData.map((pm, idx) => (
              <div key={pm.method} className={idx > 0 ? "border-t border-[#C6C6C8]/20 dark:border-gray-800" : ""}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[15px] text-primary dark:text-white">{pm.method}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] tabular-nums text-primary dark:text-white">{formatCurrency(pm.total)}</span>
                    <span className="text-[11px] text-[#8E8E93] w-8 text-right">{totalMonth > 0 ? `${Math.round((pm.total / totalMonth) * 100)}%` : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] font-medium text-[#8E8E93] uppercase">Gastos</p>
        <div className="flex gap-4">
          <button onClick={() => setShowSearch(!showSearch)} className="text-[15px] text-[#007AFF]">
            {showSearch ? "Cerrar" : "Buscar"}
          </button>
          <button onClick={() => setMoreMenuOpen(!moreMenuOpen)} className="text-[15px] text-[#007AFF]">Mas</button>
        </div>
      </div>

      {/* Expense list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-[#8E8E93]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : expenses.length === 0 && categories.length === 0 ? (
          /* Onboarding banner for first-time users */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <p className="text-[17px] font-semibold text-primary dark:text-white">Bienvenido</p>
            <p className="text-[15px] text-[#8E8E93] mt-1">Agrega tu primer gasto</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <p className="text-[15px] text-[#8E8E93]">Sin gastos este mes</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="text-[15px] text-[#007AFF] font-medium mt-2 transition-colors"
            >
              Agregar primer gasto
            </button>
          </div>
        ) : (
          <>
            {/* Collapsible search and filter bar */}
            {showSearch && (
              <div className="px-1 pb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar gastos..."
                  className="w-full bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-xl px-4 py-2 text-[16px] text-primary dark:text-white placeholder:text-[#8E8E93] outline-none"
                />
              </div>
            )}

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[15px] text-[#8E8E93]">Sin resultados para este filtro</p>
              </div>
            ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.date}>
                  <p className="text-[13px] font-medium text-[#8E8E93] uppercase px-1 mb-1.5">
                    {group.date === todayStr ? "Hoy" : formatDate(group.date)} · {formatCurrency(group.total)}
                  </p>
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
                    {group.items.map((e, i) => (
                      <React.Fragment key={e.id}>
                        {i > 0 && <div className="border-t border-[#C6C6C8]/30 dark:border-gray-700/50 ml-14" />}
                        <div
                          className={`flex items-center py-3 px-4 active:bg-[#E5E5EA]/50 dark:active:bg-gray-800/50 transition-colors cursor-pointer ${deletingId === e.id ? "opacity-50" : ""}`}
                          onClick={() => { setEditing(e); setModalOpen(true); }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] text-primary dark:text-white">{iconMap[e.category] || getCategoryIcon(e.category)} {e.category}</p>
                            {e.notes && <p className="text-[13px] text-[#8E8E93] truncate">{e.notes}</p>}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[15px] font-semibold text-primary dark:text-white tabular-nums">{formatCurrency(e.amount)}</p>
                            <p className="text-[11px] text-[#8E8E93]">{e.payment_method}</p>
                          </div>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); handleDuplicate(e); }}
                            className="ml-1 p-1 text-[#C7C7CC] hover:text-[#007AFF] transition-colors flex-shrink-0"
                            title="Duplicar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <svg className="h-4 w-4 text-[#C7C7CC] ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(v => v + 15)}
                  className="w-full py-3 text-[15px] text-[#007AFF] font-medium"
                >
                  Ver mas ({allFilteredExpenses.length - visibleCount} restantes)
                </button>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-3 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-right">Monto</th>
                      <th className="px-3 py-3 text-left">Categoria</th>
                      <th className="px-3 py-3 text-left">Notas</th>
                      <th className="px-3 py-3 text-left">Metodo</th>
                      <th className="px-3 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGroups.map((group) => (
                      <React.Fragment key={group.date}>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={6} className="px-3 py-2 text-xs font-medium text-muted dark:text-gray-400 uppercase">
                            {group.date === todayStr ? "Hoy" : formatDate(group.date)} — {formatCurrency(group.total)}
                          </td>
                        </tr>
                        {group.items.map((e, i) => (
                      <tr key={e.id} className={`border-b border-gray-50 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-surface dark:bg-gray-800"} ${deletingId === e.id ? "opacity-50" : ""}`}>
                        <td className="px-3 py-3 font-medium text-muted dark:text-gray-400">{group.items.length - i}</td>
                        <td className="px-3 py-3 text-right font-semibold">{formatCurrency(e.amount)}</td>
                        <td className="px-3 py-3">
                          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full text-white"
                            style={{ backgroundColor: colorMap[e.category] || "#6B7280" }}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {e.notes ? (
                            <span className="block truncate max-w-[180px]" title={e.notes}>{e.notes}</span>
                          ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted dark:text-gray-400">{e.payment_method}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleDuplicate(e)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                              title="Duplicar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setEditing(e); setModalOpen(true); }}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-primary dark:text-white hover:bg-surface dark:hover:bg-gray-800 transition-colors"
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(e.id)}
                              disabled={deletingId === e.id}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(v => v + 15)}
                  className="w-full py-3 text-[15px] text-[#007AFF] font-medium"
                >
                  Ver mas ({allFilteredExpenses.length - visibleCount} restantes)
                </button>
              )}
            </div>
          </>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar gasto"
        message="Este gasto se eliminara permanentemente. Esta accion no se puede deshacer."
      />
      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editingExpense={editing}
        categories={categories}
        userId={user.id}
        saving={saving}
        defaultCategory={prefs.last_category}
        defaultPaymentMethod={prefs.last_payment_method}
      />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} expenses={allExpenses} categories={categories} />
    </div>

    {/* Action sheet for "Mas" menu */}
    {moreMenuOpen && (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMoreMenuOpen(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 animate-slide-up">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
            <button onClick={() => { setExportOpen(true); setMoreMenuOpen(false); }}
              className="w-full py-3.5 text-[17px] text-[#007AFF] font-medium">Exportar</button>
          </div>
          <button onClick={() => setMoreMenuOpen(false)}
            className="w-full mt-2 bg-white dark:bg-[#1C1C1E] rounded-2xl py-3.5 text-[17px] text-[#007AFF] font-semibold">
            Cancelar
          </button>
        </div>
      </>
    )}

    {/* Floating Action Button */}
    <button
      onClick={() => { setEditing(null); setModalOpen(true); }}
      className={`fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 bg-[#007AFF] text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${fabVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"}`}
      style={{ boxShadow: "0 4px 16px rgba(0,122,255,0.4)" }}
      aria-label="Nuevo Gasto"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
    </>
  );
}
