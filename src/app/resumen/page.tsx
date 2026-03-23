"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PersonalExpense, CATEGORY_COLORS } from "@/lib/supabase";
import { formatCurrency, MONTH_NAMES } from "@/lib/format";

export default function ResumenPage() {
  const router = useRouter();
  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const from = `${selectedYear}-01-01`;
      const to = `${selectedYear}-12-31`;
      const res = await fetch(`/api/personal-expenses?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAllExpenses(data);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    setLoading(true);
    fetchExpenses();
  }, [fetchExpenses]);

  const years = useMemo(() => {
    const curr = new Date().getFullYear();
    return [curr, curr - 1, curr - 2];
  }, []);

  // Group expenses by month
  const monthlyData = useMemo(() => {
    const months = MONTH_NAMES.map((name, idx) => {
      const monthNum = String(idx + 1).padStart(2, "0");
      const monthExpenses = allExpenses.filter((e) => {
        const m = e.date.split("-")[1];
        return m === monthNum;
      });

      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Category breakdown
      const catMap: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });
      const categories = Object.entries(catMap)
        .map(([cat, amount]) => ({
          name: cat,
          amount,
          pct: total > 0 ? (amount / total) * 100 : 0,
          color: CATEGORY_COLORS[cat] || "#6B7280",
        }))
        .sort((a, b) => b.amount - a.amount);

      // Method breakdown
      const methodMap: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        methodMap[e.payment_method] = (methodMap[e.payment_method] || 0) + e.amount;
      });
      const methods = Object.entries(methodMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      return { name, idx, total, count: monthExpenses.length, categories, methods, expenses: monthExpenses };
    });

    return months;
  }, [allExpenses]);

  const yearTotal = monthlyData.reduce((sum, m) => sum + m.total, 0);
  const yearCount = monthlyData.reduce((sum, m) => sum + m.count, 0);
  const maxMonthTotal = Math.max(...monthlyData.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3">
        <select
          value={selectedYear}
          onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setExpandedMonth(null); }}
          className="border border-gray-200 rounded-xl px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-accent outline-none bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Year KPI */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-accent text-center">
        <p className="text-sm text-muted uppercase tracking-wider">Total {selectedYear}</p>
        <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(yearTotal)}</p>
        <p className="text-sm text-muted mt-1">{yearCount} gasto{yearCount !== 1 ? "s" : ""}</p>
      </div>

      {/* Monthly grid */}
      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {monthlyData.map((month) => (
            <div key={month.idx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Month header - clickable */}
              <button
                onClick={() => setExpandedMonth(expandedMonth === month.idx ? null : month.idx)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <span className="text-accent font-bold text-sm">{String(month.idx + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-primary">{month.name}</p>
                    <p className="text-xs text-muted">{month.count} gasto{month.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(month.total)}</p>
                    {yearTotal > 0 && (
                      <p className="text-xs text-muted">{((month.total / yearTotal) * 100).toFixed(1)}% del año</p>
                    )}
                  </div>
                  {/* Bar indicator */}
                  <div className="w-20 bg-gray-100 rounded-full h-2 hidden sm:block">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${(month.total / maxMonthTotal) * 100}%` }}
                    />
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-muted transition-transform duration-200 ${expandedMonth === month.idx ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expandedMonth === month.idx && month.count > 0 && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Category breakdown */}
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">Por Categoría</p>
                    <div className="space-y-2">
                      {month.categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm text-primary flex-1">{cat.name}</span>
                          <span className="text-sm font-medium text-primary">{formatCurrency(cat.amount)}</span>
                          <span className="text-xs text-muted w-12 text-right">{cat.pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    {/* Mini stacked bar */}
                    <div className="mt-2 flex rounded-full h-2 overflow-hidden">
                      {month.categories.map((cat) => (
                        <div
                          key={cat.name}
                          className="h-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: cat.color, minWidth: cat.pct > 0 ? "3px" : "0" }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Method breakdown */}
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">Por Método de Pago</p>
                    <div className="flex flex-wrap gap-2">
                      {month.methods.map((m) => (
                        <div key={m.name} className="bg-surface rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-muted">{m.name}:</span>{" "}
                          <span className="font-medium text-primary">{formatCurrency(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link to details */}
                  <button
                    onClick={() => router.push(`/?month=${month.idx}&year=${selectedYear}`)}
                    className="w-full text-center text-sm text-accent hover:text-accent-light font-medium py-2 transition-colors"
                  >
                    Ver todos los gastos de {month.name} →
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
