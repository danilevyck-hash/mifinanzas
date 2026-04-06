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
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30 dark:border-gray-700/50">
          <button type="button" onClick={onClose} className="text-[17px] text-[#007AFF] min-w-[70px] text-left">Cancelar</button>
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">Presupuesto</h2>
          <button type="submit" disabled={saving} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right disabled:opacity-50">
            {saving ? "..." : "Guardar"}
          </button>
        </div>
        <div className="p-5 space-y-4">
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
        </div>
      </form>
    </div>
  );
}
