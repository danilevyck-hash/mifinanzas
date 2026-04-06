"use client";

import { useState, useEffect } from "react";
import { CategoryBudget } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  month: string; // "YYYY-MM"
  existingBudget: CategoryBudget | null;
  onSaved: () => void;
};

export default function BudgetModal({ isOpen, onClose, category, month, existingBudget, onSaved }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(existingBudget ? existingBudget.budget_amount.toString() : "");
    }
  }, [isOpen, existingBudget]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      toast("Monto invalido", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/category-budgets", {
        method: "POST",
        body: JSON.stringify({ category, budget_amount: val, month }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
        return;
      }
      toast("Presupuesto guardado");
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
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl  w-full sm:max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Presupuesto</h2>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-muted dark:text-gray-400">
            Presupuesto mensual para <span className="font-semibold text-primary dark:text-white">{category}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="0.00"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              {saving ? "Guardando..." : "Guardar"}
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
