"use client";

import { useState, useEffect } from "react";
import { Category, CategoryBudget } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  budgets: CategoryBudget[];
  month: string;
  onSaved: () => void;
};

export default function BulkBudgetModal({ isOpen, onClose, categories, budgets, month, onSaved }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      categories.forEach((cat) => {
        const existing = budgets.find((b) => b.category === cat.name);
        initial[cat.name] = existing ? existing.budget_amount.toString() : "";
      });
      setAmounts(initial);
    }
  }, [isOpen, categories, budgets]);

  if (!isOpen) return null;

  const handleChange = (catName: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [catName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const entries = Object.entries(amounts).filter(([, val]) => val.trim() !== "");
      let errorCount = 0;
      for (const [category, val] of entries) {
        const budget_amount = parseFloat(val);
        if (isNaN(budget_amount) || budget_amount < 0) continue;
        const res = await authFetch("/api/category-budgets", {
          method: "POST",
          body: JSON.stringify({ category, budget_amount, month }),
        });
        if (!res.ok) errorCount++;
      }
      if (errorCount > 0) {
        toast(`${errorCount} presupuesto(s) no se pudieron guardar`, "error");
      } else {
        toast("Presupuestos guardados");
      }
      onSaved();
      onClose();
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl dark:shadow-gray-900/20 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Presupuestos del mes</h2>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <p className="text-sm text-muted dark:text-gray-400 mb-2">
            Configura el presupuesto de cada categoria para <span className="font-semibold text-primary dark:text-white">{month}</span>
          </p>
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-primary dark:text-white flex-1 truncate">{cat.name}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={amounts[cat.name] || ""}
                onChange={(e) => handleChange(cat.name, e.target.value)}
                className="w-28 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-sm bg-white dark:bg-gray-800 text-primary dark:text-white text-right"
                placeholder="0.00"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              {saving ? "Guardando..." : "Guardar todo"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
