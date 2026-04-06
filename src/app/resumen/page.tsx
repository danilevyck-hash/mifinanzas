"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PersonalExpense, Category } from "@/lib/supabase";
import { formatCurrency, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export default function ResumenPage() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const from = `${selectedYear}-01-01`;
      const to = `${selectedYear}-12-31`;
      const res = await authFetch(`/api/personal-expenses?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAllExpenses(data);
      }
    } catch { /* network error */ }
    finally { setLoading(false); }
  }, [selectedYear, user, authFetch]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/categories`);
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setCategories(data); }
    } catch { /* network error */ }
  }, [user, authFetch]);

  useEffect(() => { setLoading(true); fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.name] = c.color; });
    return map;
  }, [categories]);

  const years = useMemo(() => {
    const curr = new Date().getFullYear();
    return [curr, curr - 1, curr - 2];
  }, []);

  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      const monthNum = String(idx + 1).padStart(2, "0");
      const monthExpenses = allExpenses.filter((e) => e.date.split("-")[1] === monthNum);
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      const catMap: Record<string, number> = {};
      monthExpenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const cats = Object.entries(catMap)
        .map(([cat, amount]) => ({
          name: cat, amount,
          pct: total > 0 ? (amount / total) * 100 : 0,
          color: colorMap[cat] || "#6B7280",
        }))
        .sort((a, b) => b.amount - a.amount);

      const methodMap: Record<string, number> = {};
      monthExpenses.forEach((e) => { methodMap[e.payment_method] = (methodMap[e.payment_method] || 0) + e.amount; });
      const methods = Object.entries(methodMap).map(([n, a]) => ({ name: n, amount: a })).sort((a, b) => b.amount - a.amount);

      return { name, idx, total, count: monthExpenses.length, categories: cats, methods };
    });
  }, [allExpenses, colorMap]);

  const yearTotal = monthlyData.reduce((s, m) => s + m.total, 0);
  const yearCount = monthlyData.reduce((s, m) => s + m.count, 0);
  const maxMonthTotal = Math.max(...monthlyData.map((m) => m.total), 1);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <select value={selectedYear}
          onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setExpandedMonth(null); }}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-primary dark:text-white font-medium focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-gray-800 text-base min-h-[48px]">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 p-5 border-l-4 border-accent text-center">
        <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Total {selectedYear}</p>
        <p className="text-3xl font-bold text-primary dark:text-white mt-1">{formatCurrency(yearTotal)}</p>
        <p className="text-sm text-muted dark:text-gray-400 mt-1">{yearCount} gasto{yearCount !== 1 ? "s" : ""}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted dark:text-gray-400 text-sm">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthlyData.map((month) => (
            <div key={month.idx} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-900/20 overflow-hidden">
              <button
                onClick={() => setExpandedMonth(expandedMonth === month.idx ? null : month.idx)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface dark:hover:bg-gray-800 transition-colors min-h-[64px]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-bold text-sm">{String(month.idx + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-primary dark:text-white text-sm sm:text-base">{month.name}</p>
                    <p className="text-xs text-muted dark:text-gray-400">{month.count} gasto{month.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <p className="font-bold text-primary dark:text-white text-sm sm:text-base">{formatCurrency(month.total)}</p>
                    {yearTotal > 0 && <p className="text-xs text-muted dark:text-gray-400">{((month.total / yearTotal) * 100).toFixed(0)}%</p>}
                  </div>
                  <div className="w-16 sm:w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2 hidden sm:block">
                    <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${(month.total / maxMonthTotal) * 100}%` }} />
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-muted dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${expandedMonth === month.idx ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedMonth === month.idx && month.count > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4 animate-fade-in">
                  <div>
                    <p className="text-sm font-medium text-muted dark:text-gray-400 mb-2">Por Categoria</p>
                    <div className="space-y-2">
                      {month.categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm text-primary dark:text-white flex-1 truncate">{cat.name}</span>
                          <span className="text-sm font-medium text-primary dark:text-white">{formatCurrency(cat.amount)}</span>
                          <span className="text-xs text-muted dark:text-gray-400 w-10 text-right">{cat.pct.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex rounded-full h-2 overflow-hidden">
                      {month.categories.map((cat) => (
                        <div key={cat.name} className="h-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: cat.color, minWidth: cat.pct > 0 ? "3px" : "0" }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted dark:text-gray-400 mb-2">Por Metodo de Pago</p>
                    <div className="flex flex-wrap gap-2">
                      {month.methods.map((m) => (
                        <div key={m.name} className="bg-surface dark:bg-gray-800 rounded-lg px-3 py-2 text-xs">
                          <span className="text-muted dark:text-gray-400">{m.name}:</span>{" "}
                          <span className="font-medium text-primary dark:text-white">{formatCurrency(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/?month=${month.idx}&year=${selectedYear}`)}
                    className="w-full text-center text-sm text-accent hover:text-accent-light font-medium py-3 transition-colors min-h-[44px]">
                    Ver gastos de {month.name} &rarr;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
