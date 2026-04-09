"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PersonalExpense, Category } from "@/lib/supabase";
import { formatCurrency, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/components/Toast";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

const MONTH_ABBR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ResumenPage() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const { dark } = useTheme();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        authFetch(`/api/personal-expenses?from=${year}-01-01&to=${year}-12-31`),
        authFetch("/api/categories"),
      ]);
      if (expRes.ok) { const d = await expRes.json(); if (Array.isArray(d)) setExpenses(d); }
      if (catRes.ok) { const d = await catRes.json(); if (Array.isArray(d)) setCategories(d); }
    } catch {
      toast("Error al cargar datos", "error");
    }
    finally { setLoading(false); }
  }, [year, user, authFetch, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { m[c.name] = c.color; });
    return m;
  }, [categories]);

  const months = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      const mm = String(idx + 1).padStart(2, "0");
      const items = expenses.filter((e) => e.date.split("-")[1] === mm);
      const total = items.reduce((s, e) => s + e.amount, 0);
      const catMap: Record<string, number> = {};
      items.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const cats = Object.entries(catMap)
        .map(([cat, amt]) => ({ name: cat, amount: amt, pct: total > 0 ? (amt / total) * 100 : 0, color: colorMap[cat] || "#8E8E93" }))
        .sort((a, b) => b.amount - a.amount);
      return { name, idx, total, count: items.length, cats };
    });
  }, [expenses, colorMap]);

  const yearTotal = months.reduce((s, m) => s + m.total, 0);
  const yearCount = months.reduce((s, m) => s + m.count, 0);
  const activeMonths = months.filter((m) => m.count > 0);
  const avgMonthly = activeMonths.length > 0 ? yearTotal / activeMonths.length : 0;

  const chartData = useMemo(() => months.map((m, i) => ({ name: MONTH_ABBR[i], total: m.total })), [months]);

  if (!user) return null;

  return (
    <div className="space-y-6 pb-4">
      {/* Year nav */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => { setYear((y) => y - 1); setExpandedMonth(null); }}
          className="w-11 h-11 flex items-center justify-center rounded-full text-[#007AFF]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-semibold text-primary dark:text-white">{year}</span>
        <button onClick={() => { setYear((y) => y + 1); setExpandedMonth(null); }}
          className="w-11 h-11 flex items-center justify-center rounded-full text-[#007AFF]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero stats */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
            <div className="p-5 text-center">
              <p className="text-[34px] font-bold text-primary dark:text-white tabular-nums">{formatCurrency(yearTotal)}</p>
              <p className="text-[13px] text-[#8E8E93] mt-1">{yearCount} gastos · Prom. {formatCurrency(avgMonthly)}/mes</p>
            </div>
          </div>

          {/* Chart */}
          {yearCount > 0 && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4">
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "#8E8E93", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8E8E93", fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} width={35} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                      contentStyle={{ backgroundColor: dark ? "#2C2C2E" : "#fff", border: "none", borderRadius: 12, fontSize: 13, color: dark ? "#fff" : "#000" }}
                    />
                    <Bar dataKey="total" fill="#007AFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Months list */}
          {activeMonths.length > 0 && (
            <div>
              <p className="text-[13px] text-[#8E8E93] uppercase px-1 mb-2">Por mes</p>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
                {activeMonths.map((month, i) => (
                  <div key={month.idx}>
                    {i > 0 && <div className="border-t border-[#C6C6C8]/20 dark:border-gray-800 ml-4" />}
                    <button
                      onClick={() => setExpandedMonth(expandedMonth === month.idx ? null : month.idx)}
                      className="w-full flex items-center justify-between px-4 py-3 active:bg-[#E5E5EA]/50 dark:active:bg-gray-800/50"
                    >
                      <span className="text-[15px] text-primary dark:text-white">{month.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] tabular-nums text-primary dark:text-white">{formatCurrency(month.total)}</span>
                        <span className="text-[11px] text-[#8E8E93] w-8 text-right">{yearTotal > 0 ? `${((month.total / yearTotal) * 100).toFixed(0)}%` : ""}</span>
                        <svg className={`h-4 w-4 text-[#C7C7CC] transition-transform ${expandedMonth === month.idx ? "rotate-90" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {expandedMonth === month.idx && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <div className="border-t border-[#C6C6C8]/20 dark:border-gray-800 pt-3 space-y-2">
                          {month.cats.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                <span className="text-[13px] text-primary dark:text-white truncate">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[13px] tabular-nums text-primary dark:text-white">{formatCurrency(cat.amount)}</span>
                                <span className="text-[11px] text-[#8E8E93] w-8 text-right">{cat.pct.toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => router.push(`/?month=${month.idx}&year=${year}`)}
                          className="w-full text-[13px] text-[#007AFF] font-medium mt-3 py-2">
                          Ver gastos de {month.name}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {yearCount === 0 && (
            <div className="text-center py-12">
              <p className="text-[17px] font-semibold text-primary dark:text-white">Sin datos</p>
              <p className="text-[15px] text-[#8E8E93] mt-1">No hay gastos registrados en {year}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
