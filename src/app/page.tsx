"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PersonalExpense, Category } from "@/lib/supabase";
import { formatCurrency, formatDate, MONTH_NAMES } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import ExpenseModal from "@/components/ExpenseModal";
import ExportModal from "@/components/ExportModal";

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted">Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
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

  const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/categories?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch { /* */ }
  }, [user]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/personal-expenses?from=${dateFrom}&to=${dateTo}&user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setExpenses(data);
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, user]);

  useEffect(() => { setLoading(true); fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const totalMonth = expenses.reduce((sum, e) => sum + e.amount, 0);

  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const fetchAllExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/personal-expenses?user_id=${user.id}`);
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setAllExpenses(data); }
    } catch { /* */ }
  }, [user]);
  useEffect(() => { fetchAllExpenses(); }, [fetchAllExpenses]);

  const handleSave = async (expense: Partial<PersonalExpense>) => {
    const method = expense.id ? "PUT" : "POST";
    await fetch("/api/personal-expenses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(expense) });
    setModalOpen(false);
    setEditing(null);
    fetchExpenses();
    fetchAllExpenses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    await fetch("/api/personal-expenses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchExpenses();
    fetchAllExpenses();
  };

  // Build color map from categories
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

  const methodData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.payment_method] = (map[e.payment_method] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total, pct: totalMonth > 0 ? (total / totalMonth) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalMonth]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h1>
        {!isCurrentMonth && (
          <a href="/" className="text-sm text-accent hover:text-accent-light transition-colors">← Volver al mes actual</a>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-accent text-center">
        <p className="text-sm text-muted uppercase tracking-wider">Total {MONTH_NAMES[viewMonth]}</p>
        <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalMonth)}</p>
        <p className="text-sm text-muted mt-1">{expenses.length} gasto{expenses.length !== 1 ? "s" : ""}</p>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Por Categoría</h2>
          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-primary">{cat.name}</span>
                  <span className="text-muted">{formatCurrency(cat.total)} ({cat.pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex rounded-full h-5 overflow-hidden">
            {categoryData.map((cat) => (
              <div key={cat.name} className="h-full transition-all duration-500"
                style={{ width: `${cat.pct}%`, backgroundColor: cat.color, minWidth: cat.pct > 0 ? "4px" : "0" }}
                title={`${cat.name}: ${cat.pct.toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-muted">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {methodData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-primary mb-3">Por Método de Pago</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {methodData.map((m) => (
              <div key={m.name} className="bg-surface rounded-xl p-3 text-center">
                <p className="text-xs text-muted uppercase">{m.name}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(m.total)}</p>
                <p className="text-xs text-muted">{m.pct.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button onClick={() => setExportOpen(true)}
          className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <span className="text-xl">+</span> Nuevo Gasto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-right">Monto</th>
                <th className="px-3 py-3 text-left">Categoría</th>
                <th className="px-3 py-3 text-left">Notas</th>
                <th className="px-3 py-3 text-left">Método</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Cargando...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Sin gastos este mes</td></tr>
              ) : (
                expenses.map((e, i) => (
                  <tr key={e.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-surface"}`}>
                    <td className="px-3 py-3 font-medium text-muted">{expenses.length - i}</td>
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
                        <span className="block truncate max-w-[120px]" title={e.notes}>{e.notes}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">{e.payment_method}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditing(e); setModalOpen(true); }} className="text-primary hover:text-accent transition-colors" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editingExpense={editing}
        categories={categories}
        onCategoryCreated={fetchCategories}
        userId={user.id}
      />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} expenses={allExpenses} categories={categories} />
    </div>
  );
}
