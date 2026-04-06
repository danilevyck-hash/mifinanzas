"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PersonalExpense, Category, Income } from "@/lib/supabase";
import { formatCurrency, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);

const MONTH_ABBR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getWeekNumber(dateStr: string): { year: number; week: number } {
  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return { year: monday.getFullYear(), week: weekNum };
}

function getCurrentWeekNumber(): { year: number; week: number } {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return getWeekNumber(`${yyyy}-${mm}-${dd}`);
}

export default function ResumenPage() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { dark } = useTheme();
  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeData, setIncomeData] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [compareA, setCompareA] = useState<number | "">("");
  const [compareB, setCompareB] = useState<number | "">("");

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

  const fetchIncome = useCallback(async () => {
    if (!user) return;
    try {
      const from = `${selectedYear}-01-01`;
      const to = `${selectedYear}-12-31`;
      const res = await authFetch(`/api/income?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setIncomeData(data);
      }
    } catch { /* network error */ }
  }, [selectedYear, user, authFetch]);

  useEffect(() => { setLoading(true); fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchIncome(); }, [fetchIncome]);

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

  // Income totals
  const totalIncome = useMemo(() => incomeData.reduce((s, i) => s + i.amount, 0), [incomeData]);
  const balance = totalIncome - yearTotal;

  // Chart data
  const chartData = useMemo(() => {
    return monthlyData.map((m, i) => ({
      name: MONTH_ABBR[i],
      total: m.total,
    }));
  }, [monthlyData]);

  // Weekly data
  const weeklyStats = useMemo(() => {
    const weekMap: Record<string, number> = {};
    allExpenses.forEach((e) => {
      const { week } = getWeekNumber(e.date);
      const key = `${week}`;
      weekMap[key] = (weekMap[key] || 0) + e.amount;
    });

    const { week: currentWeek } = getCurrentWeekNumber();
    const thisWeek = weekMap[String(currentWeek)] || 0;
    const lastWeek = weekMap[String(currentWeek - 1)] || 0;

    const weekValues = Object.values(weekMap);
    const avgWeekly = weekValues.length > 0 ? weekValues.reduce((a, b) => a + b, 0) / weekValues.length : 0;

    return { thisWeek, lastWeek, avgWeekly };
  }, [allExpenses]);

  // Year payment method breakdown
  const yearMethods = useMemo(() => {
    const methodMap: Record<string, number> = {};
    allExpenses.forEach((e) => {
      methodMap[e.payment_method] = (methodMap[e.payment_method] || 0) + e.amount;
    });
    return Object.entries(methodMap)
      .map(([name, amount]) => ({ name, amount, pct: yearTotal > 0 ? (amount / yearTotal) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [allExpenses, yearTotal]);

  // Months with data for comparison
  const monthsWithData = useMemo(() => {
    return monthlyData.filter((m) => m.count > 0).map((m) => m.idx);
  }, [monthlyData]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (compareA === "" || compareB === "") return null;
    const a = monthlyData[compareA];
    const b = monthlyData[compareB];
    if (!a || !b) return null;

    const allCats = new Set([...a.categories.map((c) => c.name), ...b.categories.map((c) => c.name)]);
    const rows = Array.from(allCats).map((cat) => {
      const amtA = a.categories.find((c) => c.name === cat)?.amount || 0;
      const amtB = b.categories.find((c) => c.name === cat)?.amount || 0;
      const diff = amtB - amtA;
      return { cat, amtA, amtB, diff, color: colorMap[cat] || "#6B7280" };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    return { monthA: a.name, monthB: b.name, totalA: a.total, totalB: b.total, rows };
  }, [compareA, compareB, monthlyData, colorMap]);

  // Category trend arrows (previous month comparison)
  const categoryTrends = useMemo(() => {
    const trends: Record<string, Record<string, "up" | "down" | null>> = {};
    for (let i = 0; i < 12; i++) {
      trends[i] = {};
      if (i === 0) continue;
      const prev = monthlyData[i - 1];
      const curr = monthlyData[i];
      curr.categories.forEach((cat) => {
        const prevAmt = prev.categories.find((c) => c.name === cat.name)?.amount;
        if (prevAmt === undefined || prevAmt === 0) {
          trends[i][cat.name] = null;
        } else if (cat.amount > prevAmt) {
          trends[i][cat.name] = "up";
        } else if (cat.amount < prevAmt) {
          trends[i][cat.name] = "down";
        } else {
          trends[i][cat.name] = null;
        }
      });
    }
    return trends;
  }, [monthlyData]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <select value={selectedYear}
          onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setExpandedMonth(null); setCompareA(""); setCompareB(""); }}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-primary dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-base min-h-[48px]">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Balance: Income vs Expenses */}
      {!loading && (
        <div>
          {totalIncome > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center">
                <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Ingresos</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center">
                <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Gastos</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(yearTotal)}</p>
              </div>
              <div className={`bg-white dark:bg-gray-900 rounded-2xl p-4 text-center`}>
                <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Balance</p>
                <p className={`text-lg font-bold mt-1 ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center">
              <p className="text-sm text-muted dark:text-gray-400">Registra tus ingresos para ver el balance</p>
            </div>
          )}
        </div>
      )}

      {/* Year total card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 text-center">
        <p className="text-xs text-muted dark:text-gray-400 uppercase tracking-wider">Total {selectedYear}</p>
        <p className="text-3xl font-bold text-primary dark:text-white mt-1">{formatCurrency(yearTotal)}</p>
        <p className="text-sm text-muted dark:text-gray-400 mt-1">{yearCount} gasto{yearCount !== 1 ? "s" : ""}</p>
      </div>

      {/* Monthly bar chart */}
      {!loading && yearCount > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4">
          <p className="text-sm font-medium text-muted dark:text-gray-400 mb-3">Gastos por Mes</p>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: dark ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: dark ? "#374151" : "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: dark ? "#9CA3AF" : "#6B7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                  contentStyle={{
                    backgroundColor: dark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "0.75rem",
                    color: dark ? "#F9FAFB" : "#0F172A",
                  }}
                />
                <Bar dataKey="total" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly summary */}
      {!loading && yearCount > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-muted dark:text-gray-400">Resumen Semanal</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-muted dark:text-gray-400">Esta semana</p>
              <p className="text-lg font-bold text-primary dark:text-white mt-1">{formatCurrency(weeklyStats.thisWeek)}</p>
            </div>
            <div className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-muted dark:text-gray-400">Semana pasada</p>
              <p className="text-lg font-bold text-primary dark:text-white mt-1">{formatCurrency(weeklyStats.lastWeek)}</p>
            </div>
          </div>
          <div className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs text-muted dark:text-gray-400">Promedio semanal</p>
            <p className="text-lg font-bold text-primary dark:text-white mt-1">{formatCurrency(weeklyStats.avgWeekly)}</p>
          </div>
        </div>
      )}

      {/* Payment method breakdown (year) */}
      {!loading && yearMethods.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-muted dark:text-gray-400">Por Metodo de Pago</p>
          <div className="grid grid-cols-2 gap-3">
            {yearMethods.map((m) => (
              <div key={m.name} className="bg-surface dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-muted dark:text-gray-400">{m.name}</p>
                <p className="text-base font-bold text-primary dark:text-white mt-1">{formatCurrency(m.amount)}</p>
                <p className="text-xs text-muted dark:text-gray-400">{m.pct.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted dark:text-gray-400 text-sm">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthlyData.map((month) => (
            <div key={month.idx} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedMonth(expandedMonth === month.idx ? null : month.idx)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface dark:hover:bg-gray-800 transition-colors min-h-[64px]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 font-bold text-sm">{String(month.idx + 1).padStart(2, "0")}</span>
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
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(month.total / maxMonthTotal) * 100}%` }} />
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
                      {month.categories.map((cat) => {
                        const trend = categoryTrends[month.idx]?.[cat.name];
                        return (
                          <div key={cat.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm text-primary dark:text-white flex-1 truncate">{cat.name}</span>
                            <span className="text-sm font-medium text-primary dark:text-white">{formatCurrency(cat.amount)}</span>
                            {trend === "up" && <span className="text-red-500 text-xs font-bold">&#8593;</span>}
                            {trend === "down" && <span className="text-green-500 text-xs font-bold">&#8595;</span>}
                            <span className="text-xs text-muted dark:text-gray-400 w-10 text-right">{cat.pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
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
                    className="w-full text-center text-sm text-blue-500 hover:text-blue-600 font-medium py-3 transition-colors min-h-[44px]">
                    Ver gastos de {month.name} &rarr;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Month comparison */}
      {!loading && monthsWithData.length >= 2 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-4">
          <p className="text-sm font-medium text-muted dark:text-gray-400">Comparar Meses</p>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-primary dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 min-h-[48px]">
              <option value="">Mes A</option>
              {monthsWithData.map((idx) => (
                <option key={idx} value={idx}>{MONTH_NAMES[idx]}</option>
              ))}
            </select>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-primary dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 min-h-[48px]">
              <option value="">Mes B</option>
              {monthsWithData.map((idx) => (
                <option key={idx} value={idx}>{MONTH_NAMES[idx]}</option>
              ))}
            </select>
          </div>

          {comparisonData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted dark:text-gray-400">{comparisonData.monthA}</p>
                  <p className="text-base font-bold text-primary dark:text-white">{formatCurrency(comparisonData.totalA)}</p>
                </div>
                <div className="bg-surface dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted dark:text-gray-400">{comparisonData.monthB}</p>
                  <p className="text-base font-bold text-primary dark:text-white">{formatCurrency(comparisonData.totalB)}</p>
                </div>
              </div>
              <div className="space-y-2">
                {comparisonData.rows.map((row) => (
                  <div key={row.cat} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="text-primary dark:text-white flex-1 truncate">{row.cat}</span>
                    <span className="text-muted dark:text-gray-400 w-20 text-right">{formatCurrency(row.amtA)}</span>
                    <span className="text-muted dark:text-gray-400 w-20 text-right">{formatCurrency(row.amtB)}</span>
                    <span className={`w-20 text-right font-medium ${row.diff > 0 ? "text-red-500" : row.diff < 0 ? "text-green-500" : "text-muted dark:text-gray-400"}`}>
                      {row.diff > 0 && <span>&#8593; </span>}
                      {row.diff < 0 && <span>&#8595; </span>}
                      {row.diff === 0 ? "-" : formatCurrency(Math.abs(row.diff))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
