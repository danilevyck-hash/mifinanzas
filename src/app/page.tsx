"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PersonalExpense, Category, CategoryBudget, PAYMENT_METHODS } from "@/lib/supabase";
import { formatCurrency, formatDate, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ExpenseModal from "@/components/ExpenseModal";
import ExportModal from "@/components/ExportModal";
import BudgetModal from "@/components/BudgetModal";
import ConfirmModal from "@/components/ConfirmModal";
import { KPISkeleton, CategorySkeleton } from "@/components/SkeletonLoader";

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
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [alertsShown, setAlertsShown] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

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
      toast(expense.id ? "Gasto actualizado" : "Gasto agregado");
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
  const avgDaily = daysPassed > 0 ? totalMonth / daysPassed : 0;
  const targetDaily = daysRemaining > 0 ? Math.max(available, 0) / daysRemaining : 0;

  // Feature 3 — Trends (vs previous month)
  const prevMonthData = useMemo(() => {
    let pm = viewMonth - 1;
    let py = viewYear;
    if (pm < 0) { pm = 11; py--; }
    const prefix = `${py}-${String(pm + 1).padStart(2, "0")}`;
    const prevExpenses = allExpenses.filter((e) => e.date.startsWith(prefix));
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { total: prevTotal, hasData: prevExpenses.length > 0 };
  }, [allExpenses, viewMonth, viewYear]);

  const dominantCategory = useMemo(() => {
    if (categoryData.length === 0) return null;
    const topCat = categoryData[0].name;
    let streak = 1;
    let m = viewMonth;
    let y = viewYear;
    for (let i = 0; i < 5; i++) {
      m--;
      if (m < 0) { m = 11; y--; }
      const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
      const monthExpenses = allExpenses.filter((e) => e.date.startsWith(prefix));
      if (monthExpenses.length === 0) break;
      const catTotals: Record<string, number> = {};
      monthExpenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
      const topInMonth = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topInMonth === topCat) streak++;
      else break;
    }
    return { name: topCat, streak, color: colorMap[topCat] || "#6B7280" };
  }, [allExpenses, categoryData, viewMonth, viewYear, colorMap]);

  const hasTrendData = prevMonthData.hasData || (dominantCategory !== null && expenses.length > 0);

  // Budget alerts on load
  useEffect(() => {
    if (alertsShown || categoryData.length === 0 || budgets.length === 0) return;
    setAlertsShown(true);
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

  const methodData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.payment_method] = (map[e.payment_method] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total, pct: totalMonth > 0 ? (total / totalMonth) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalMonth]);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (filterMethod) {
      result = result.filter((e) => e.payment_method === filterMethod);
    }
    return result;
  }, [expenses, searchQuery, filterCategory, filterMethod]);

  const navigateMonth = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    router.push(`/?month=${m}&year=${y}`);
  };

  if (!user) return null;

  return (
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
          <h1 className="text-xl font-semibold text-primary dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h1>
          {!isCurrentMonth && (
            <button onClick={() => router.push("/")} className="text-xs text-accent hover:text-accent-light transition-colors">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gastado</p>
            <p className="text-2xl font-semibold text-primary dark:text-white mt-1">{formatCurrency(totalMonth)}</p>
            <p className={`text-xs mt-1 ${spentPct >= 100 ? "text-red-500" : spentPct >= 80 ? "text-amber-500" : "text-[#1e3a5f]"}`}>
              {Math.round(spentPct)}% del presupuesto · {expenses.length} gasto{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponible</p>
            <p className={`text-2xl font-semibold mt-1 ${available < 0 ? "text-red-500" : "text-primary dark:text-white"}`}>
              {available < 0 ? `-${formatCurrency(Math.abs(available))} por encima` : formatCurrency(available)}
            </p>
            {isCurrentMonth && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {daysRemaining === 0 ? "ultimo dia del mes" : `quedan ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Promedio diario</p>
            <p className="text-2xl font-semibold text-primary dark:text-white mt-1">{formatCurrency(avgDaily)}</p>
            {isCurrentMonth && daysRemaining > 0 && (
              <p className={`text-xs mt-1 ${avgDaily > targetDaily ? "text-amber-500" : "text-green-500"}`}>
                target: {formatCurrency(targetDaily)}/dia
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5 border-l-4 border-accent text-center">
          <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Total {MONTH_NAMES[viewMonth]}</p>
          <p className="text-3xl font-bold text-primary dark:text-white mt-1">{formatCurrency(totalMonth)}</p>
          <p className="text-sm text-muted dark:text-gray-400 mt-1">{expenses.length} gasto{expenses.length !== 1 ? "s" : ""}</p>
          {expenses.length > 0 && categoryData.length > 0 && (
            <button
              onClick={() => { setBudgetCategory(categoryData[0].name); setBudgetModalOpen(true); }}
              className="text-accent hover:text-accent-light text-xs font-medium mt-2 transition-colors"
            >
              Configurar presupuesto para ver KPIs
            </button>
          )}
        </div>
      )}

      {/* Category breakdown — Apple Storage style */}
      {loading ? (
        <CategorySkeleton />
      ) : categoryData.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5">
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
                      <span className="font-medium text-primary dark:text-white">{cat.name}</span>
                      <button
                        onClick={() => { setBudgetCategory(cat.name); setBudgetModalOpen(true); }}
                        className="text-muted dark:text-gray-400 hover:text-accent transition-colors"
                        title="Configurar presupuesto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-muted dark:text-gray-400 text-xs truncate ml-2">
                      {hasBudget ? `${formatCurrency(cat.total)} / ${formatCurrency(budget)}` : formatCurrency(cat.total)}
                    </span>
                  </div>
                  {hasBudget ? (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetBarColor }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${
                        budgetPct >= 100 ? "text-red-500" : budgetPct >= 80 ? "text-amber-500" : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {budgetPct >= 100
                          ? `${formatCurrency(Math.abs(remaining))} por encima del presupuesto`
                          : budgetPct >= 80
                            ? `Cuidado — solo quedan ${formatCurrency(remaining)}`
                            : `Te quedan ${formatCurrency(remaining)}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sin presupuesto configurado</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex rounded-full h-4 overflow-hidden">
            {categoryData.map((cat) => (
              <div key={cat.name} className="h-full transition-all duration-500"
                style={{ width: `${cat.pct}%`, backgroundColor: cat.color, minWidth: cat.pct > 0 ? "4px" : "0" }}
                title={`${cat.name}: ${cat.pct.toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-muted dark:text-gray-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Payment method breakdown */}
      {methodData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5">
          <h2 className="text-base font-semibold text-primary dark:text-white mb-3">Por Metodo de Pago</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {methodData.map((m) => (
              <div key={m.name} className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs text-muted dark:text-gray-400 uppercase">{m.name}</p>
                <p className="text-lg font-bold text-primary dark:text-white">{formatCurrency(m.total)}</p>
                <p className="text-xs text-muted dark:text-gray-400">{m.pct.toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend KPIs */}
      {hasTrendData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">vs. mes anterior</p>
            {!prevMonthData.hasData ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Sin datos previos</p>
            ) : prevMonthData.total < 50 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Mes anterior: {formatCurrency(prevMonthData.total)} (datos insuficientes)</p>
            ) : (() => {
              const diff = totalMonth - prevMonthData.total;
              const changePct = (diff / prevMonthData.total) * 100;
              const isMore = diff > 0;
              return (
                <>
                  <p className={`text-2xl font-semibold mt-1 ${isMore ? "text-red-500" : "text-green-500"}`}>
                    {isMore ? "+" : ""}{Math.round(changePct)}%
                  </p>
                  <p className={`text-xs mt-1 ${isMore ? "text-red-400" : "text-green-400"}`}>
                    {isMore ? `gastaste ${formatCurrency(diff)} mas` : `ahorraste ${formatCurrency(Math.abs(diff))}`}
                  </p>
                </>
              );
            })()}
          </div>
          {dominantCategory && expenses.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria dominante</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dominantCategory.color }} />
                <p className="text-2xl font-semibold text-primary dark:text-white">{dominantCategory.name}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dominantCategory.streak <= 1 ? "este mes" : `${dominantCategory.streak} meses seguidos`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <button onClick={() => setExportOpen(true)}
          className="bg-white dark:bg-gray-900 border-2 border-primary text-primary dark:text-white hover:bg-primary hover:text-white font-semibold px-5 py-3 rounded-xl shadow-sm dark:shadow-gray-900/20 transition-colors flex items-center gap-2 min-h-[48px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 rounded-xl shadow-sm dark:shadow-gray-900/20 transition-colors flex items-center gap-2 min-h-[48px]">
          <span className="text-xl leading-none">+</span> Nuevo Gasto
        </button>
      </div>

      {/* Expense list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-8 text-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted dark:text-gray-400 text-sm">Cargando gastos...</p>
          </div>
        ) : expenses.length === 0 && categories.length === 0 ? (
          /* Onboarding banner for first-time users */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-6 text-center">
            <h2 className="text-xl font-semibold text-primary dark:text-white">Bienvenido a MiFinanzas</h2>
            <p className="text-muted dark:text-gray-400 mt-1">Empieza registrando tu primer gasto</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 rounded-xl shadow-sm dark:shadow-gray-900/20 transition-colors mt-4 min-h-[48px]"
            >
              Agregar primer gasto
            </button>
            <p className="text-sm text-muted dark:text-gray-400 mt-4">
              1. Crea una categoria &rarr; 2. Registra un gasto &rarr; 3. Configura tu presupuesto
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-8 text-center">
            <p className="text-muted dark:text-gray-400">Sin gastos este mes</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="text-accent hover:text-accent-light text-sm font-medium mt-2 transition-colors"
            >
              Agregar primer gasto
            </button>
          </div>
        ) : (
          <>
            {/* Search and filter bar */}
            {expenses.length >= 2 && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por notas o categoria..."
                  className="flex-1 min-w-[180px] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-sm"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white dark:bg-gray-900 transition-shadow text-sm"
                >
                  <option value="">Todas</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white dark:bg-gray-900 transition-shadow text-sm"
                >
                  <option value="">Todos</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {filteredExpenses.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-8 text-center">
                <p className="text-muted dark:text-gray-400">Sin resultados para este filtro</p>
              </div>
            ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {filteredExpenses.map((e) => (
                <div key={e.id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 p-4 ${deletingId === e.id ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full text-white flex-shrink-0"
                          style={{ backgroundColor: colorMap[e.category] || "#6B7280" }}
                        >
                          {e.category}
                        </span>
                        <span className="text-xs text-muted dark:text-gray-400">{formatDate(e.date)}</span>
                      </div>
                      <p className="text-lg font-bold text-primary dark:text-white">{formatCurrency(e.amount)}</p>
                      {e.notes && <p className="text-sm text-muted dark:text-gray-400 truncate mt-0.5">{e.notes}</p>}
                      <p className="text-xs text-muted dark:text-gray-400 mt-1">{e.payment_method}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditing(e); setModalOpen(true); }}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-primary dark:text-white hover:bg-surface dark:hover:bg-gray-800 transition-colors"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(e.id)}
                        disabled={deletingId === e.id}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-3 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Fecha</th>
                      <th className="px-3 py-3 text-right">Monto</th>
                      <th className="px-3 py-3 text-left">Categoria</th>
                      <th className="px-3 py-3 text-left">Notas</th>
                      <th className="px-3 py-3 text-left">Metodo</th>
                      <th className="px-3 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((e, i) => (
                      <tr key={e.id} className={`border-b border-gray-50 dark:border-gray-800 ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-surface dark:bg-gray-800"} ${deletingId === e.id ? "opacity-50" : ""}`}>
                        <td className="px-3 py-3 font-medium text-muted dark:text-gray-400">{filteredExpenses.length - i}</td>
                        <td className="px-3 py-3">{formatDate(e.date)}</td>
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
                  </tbody>
                </table>
              </div>
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
        onCategoryCreated={fetchCategories}
        userId={user.id}
        saving={saving}
      />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} expenses={allExpenses} categories={categories} />
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        category={budgetCategory}
        month={viewMonthStr}
        existingBudget={budgets.find((b) => b.category === budgetCategory) || null}
        onSaved={fetchBudgets}
      />
    </div>
  );
}
