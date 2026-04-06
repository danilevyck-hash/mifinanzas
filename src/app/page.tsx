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
import IncomeModal from "@/components/IncomeModal";
import ImportModal from "@/components/ImportModal";
import Confetti from "@/components/Confetti";
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
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiShown, setConfettiShown] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [visibleDays, setVisibleDays] = useState(5);
  const [duplicating, setDuplicating] = useState<PersonalExpense | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

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
      setDuplicating(null);
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

  // Confetti: show when viewing current month, have budgets, and under budget
  useEffect(() => {
    if (confettiShown || !hasBudgets || loading || !isCurrentMonth) return;
    if (daysPassed >= 25 && spentPct < 100 && expenses.length > 0) {
      setShowConfetti(true);
      setConfettiShown(true);
    }
  }, [confettiShown, hasBudgets, loading, isCurrentMonth, daysPassed, spentPct, expenses.length]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreMenuOpen]);

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

  const visibleGroups = groupedExpenses.slice(0, visibleDays);
  const hasMoreDays = groupedExpenses.length > visibleDays;

  const navigateMonth = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setVisibleDays(5);
    router.push(`/?month=${m}&year=${y}`);
  };

  if (!user) return null;

  return (
    <>
    <div className="space-y-5">
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

      {/* Budget KPIs — Pulso del mes */}
      {loading ? (
        <KPISkeleton />
      ) : hasBudgets ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gastado</p>
            <p className="text-[28px] font-semibold text-primary dark:text-white mt-1 leading-tight">{formatCurrency(totalMonth)}</p>
            <p className={`text-xs mt-1 ${spentPct >= 100 ? "text-red-500" : spentPct >= 80 ? "text-amber-500" : "text-gray-500 dark:text-gray-400"}`}>
              {Math.round(spentPct)}% del presupuesto
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponible</p>
            <p className={`text-[28px] font-semibold mt-1 leading-tight ${available < 0 ? "text-red-500" : "text-primary dark:text-white"}`}>
              {available < 0 ? `-${formatCurrency(Math.abs(available))}` : formatCurrency(available)}
            </p>
            {isCurrentMonth && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {daysRemaining === 0 ? "ultimo dia del mes" : `quedan ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border-l-4 border-blue-500 text-center">
          <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Total {MONTH_NAMES[viewMonth]}</p>
          <p className="text-3xl font-bold text-primary dark:text-white mt-1">{formatCurrency(totalMonth)}</p>
          <p className="text-sm text-muted dark:text-gray-400 mt-1">{expenses.length} gasto{expenses.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* vs mes anterior — compact */}
      {prevMonthData.hasData && prevMonthData.total >= 50 && (
        <div className="border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted dark:text-gray-400">vs. mes anterior</span>
          {(() => {
            const diff = totalMonth - prevMonthData.total;
            const changePct = prevMonthData.total > 0 ? (diff / prevMonthData.total) * 100 : 0;
            const isMore = diff > 0;
            return (
              <span className={`text-sm font-semibold ${isMore ? "text-red-500" : "text-green-500"}`}>
                {isMore ? "+" : ""}{Math.round(changePct)}% ({isMore ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`})
              </span>
            );
          })()}
        </div>
      )}

      {/* Category breakdown — Apple Storage style */}
      {loading ? (
        <CategorySkeleton />
      ) : categoryData.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-primary dark:text-white mb-3">Por Categoria</h2>
          <div className="space-y-4">
            {sortedCategoryData.map((cat) => {
              const budget = budgetMap[cat.name];
              const hasBudget = budget != null && budget > 0;
              const budgetPct = hasBudget ? (cat.total / budget) * 100 : 0;
              const budgetBarColor = budgetPct >= 100 ? "#ef4444" : budgetPct >= 80 ? "#f59e0b" : "#1e3a5f";
              const remaining = hasBudget ? budget - cat.total : 0;

              return (
                <div key={cat.name} className={!hasBudget ? "opacity-60" : ""}>
                  <div className="flex items-center justify-between text-sm mb-1 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-primary dark:text-white">{iconMap[cat.name] || getCategoryIcon(cat.name)} {cat.name}</span>
                    </div>
                    <span className="text-muted dark:text-gray-400 text-xs truncate ml-2">
                      {hasBudget ? `${formatCurrency(cat.total)} / ${formatCurrency(budget)}` : formatCurrency(cat.total)}
                    </span>
                  </div>
                  {hasBudget ? (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetBarColor }} />
                      </div>
                      <p className={`text-xs mt-1 ${budgetPct >= 100 ? "text-red-500" : budgetPct >= 80 ? "text-amber-500" : "text-gray-500 dark:text-gray-400"}`}>
                        {budgetPct >= 100 ? `${formatCurrency(Math.abs(remaining))} por encima` : budgetPct >= 80 ? `Cuidado — quedan ${formatCurrency(remaining)}` : `Te quedan ${formatCurrency(remaining)}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sin presupuesto</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex justify-end gap-4">
        <button onClick={() => setExportOpen(true)}
          className="text-blue-500 text-sm font-medium min-h-[44px] transition-colors hover:text-blue-600">
          Exportar
        </button>
        <div className="relative" ref={moreMenuRef}>
          <button onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="text-blue-500 text-sm font-medium min-h-[44px] transition-colors hover:text-blue-600">
            Mas
          </button>
          {moreMenuOpen && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl  overflow-hidden z-30 min-w-[160px]">
              <button onClick={() => { setExportOpen(true); setMoreMenuOpen(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-primary dark:text-white">Exportar</button>
              <button onClick={() => { setImportOpen(true); setMoreMenuOpen(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-primary dark:text-white border-t border-gray-100 dark:border-gray-700">Importar CSV</button>
            </div>
          )}
        </div>
      </div>

      {/* Expense list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl  p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted dark:text-gray-400 text-sm">Cargando gastos...</p>
          </div>
        ) : expenses.length === 0 && categories.length === 0 ? (
          /* Onboarding banner for first-time users */
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold text-primary dark:text-white">Bienvenido</h2>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors mt-4 min-h-[48px]"
            >
              Agrega tu primer gasto
            </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl  p-8 text-center">
            <p className="text-muted dark:text-gray-400">Sin gastos este mes</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 transition-colors"
            >
              Agregar primer gasto
            </button>
          </div>
        ) : (
          <>
            {/* Collapsible search and filter bar */}
            {expenses.length >= 2 && (
              <div className="space-y-2">
                <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-1.5 text-sm text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors min-h-[44px] px-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Filtrar
                </button>
                {showSearch && (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar notas, categoria, metodo..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm bg-white dark:bg-gray-900"
                  />
                )}
              </div>
            )}

            {filteredExpenses.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl  p-8 text-center">
                <p className="text-muted dark:text-gray-400">Sin resultados para este filtro</p>
              </div>
            ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.date} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-medium text-muted dark:text-gray-400 uppercase">
                      {formatDate(group.date)}
                    </p>
                    <p className="text-xs font-semibold text-primary dark:text-white">
                      {formatCurrency(group.total)}
                    </p>
                  </div>
                  {group.items.map((e) => (
                <div key={e.id} className={`bg-white dark:bg-gray-900 rounded-xl p-4 ${deletingId === e.id ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary dark:text-white">
                        <span className="mr-1">{iconMap[e.category] || getCategoryIcon(e.category)}</span>
                        {e.category}
                      </p>
                      {e.notes && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{e.notes}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{e.payment_method}</p>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <p className="text-lg font-bold text-primary dark:text-white text-right">{formatCurrency(e.amount)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                    <button
                      onClick={() => { setDuplicating(e); setModalOpen(true); }}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                      title="Duplicar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setEditing(e); setModalOpen(true); }}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(e.id)}
                      disabled={deletingId === e.id}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                  ))}
                </div>
              ))}
              {hasMoreDays && (
                <button
                  onClick={() => setVisibleDays((v) => v + 5)}
                  className="w-full py-2 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Ver mas dias ({groupedExpenses.length - visibleDays} restantes)
                </button>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-2xl  overflow-hidden">
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
                            {formatDate(group.date)} — {formatCurrency(group.total)}
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
                              onClick={() => { setDuplicating(e); setModalOpen(true); }}
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
              {hasMoreDays && (
                <button
                  onClick={() => setVisibleDays((v) => v + 5)}
                  className="w-full py-2 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Ver mas dias ({groupedExpenses.length - visibleDays} restantes)
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
        onClose={() => { setModalOpen(false); setEditing(null); setDuplicating(null); }}
        onSave={handleSave}
        editingExpense={editing}
        duplicateExpense={duplicating}
        categories={categories}
        userId={user.id}
        saving={saving}
        defaultCategory={prefs.last_category}
        defaultPaymentMethod={prefs.last_payment_method}
      />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} expenses={allExpenses} categories={categories} />
      <IncomeModal
        isOpen={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        onSave={() => { setIncomeOpen(false); }}
        editingIncome={null}
      />
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={() => { setImportOpen(false); fetchExpenses(); fetchAllExpenses(); }}
      />
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>

    {/* Floating Action Button */}
    <button
      onClick={() => { setEditing(null); setModalOpen(true); }}
      className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full  flex items-center justify-center transition-all active:scale-95"
      aria-label="Nuevo Gasto"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
    </>
  );
}
