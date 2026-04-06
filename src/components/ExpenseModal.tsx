"use client";

import { useState, useEffect } from "react";
import { PersonalExpense, Category, PAYMENT_METHODS, DEFAULT_COLORS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<PersonalExpense>) => void;
  editingExpense: PersonalExpense | null;
  categories: Category[];
  onCategoryCreated: () => void;
  userId: number;
  saving?: boolean;
};

export default function ExpenseModal({ isOpen, onClose, onSave, editingExpense, categories, onCategoryCreated, userId, saving }: Props) {
  const { authFetch } = useAuth();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setNotes(editingExpense.notes || "");
      setPaymentMethod(editingExpense.payment_method);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setCategory(categories.length > 0 ? categories[0].name : "");
      setNotes("");
      setPaymentMethod(PAYMENT_METHODS[0]);
    }
    setShowNewCategory(categories.length === 0);
    setNewCategoryName("");
  }, [editingExpense, isOpen, categories]);

  if (!isOpen) return null;

  const handleCategoryChange = (value: string) => {
    if (value === "__new__") {
      setShowNewCategory(true);
    } else {
      setCategory(value);
      setShowNewCategory(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const colorIdx = categories.length % DEFAULT_COLORS.length;
      const res = await authFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName.trim(), color: DEFAULT_COLORS[colorIdx] }),
      });
      if (res.ok) {
        setCategory(newCategoryName.trim());
        setShowNewCategory(false);
        setNewCategoryName("");
        onCategoryCreated();
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Partial<PersonalExpense> = {
      user_id: userId,
      date,
      amount: parseFloat(amount) || 0,
      category,
      notes: notes.trim() || undefined,
      payment_method: paymentMethod,
    };
    if (editingExpense) {
      expense.id = editingExpense.id;
    }
    onSave(expense);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl dark:shadow-gray-900/20 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
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
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              required
            />
            <p className="text-xs text-muted dark:text-gray-400 mt-0.5">Formato: DD/MM/AAAA</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Categoria</label>
            {!showNewCategory ? (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white dark:bg-gray-800 text-primary dark:text-white transition-shadow text-base"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="__new__">+ Crear nueva categoria...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
                  placeholder="Nombre de la categoria"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold px-4 rounded-xl transition-colors text-sm min-h-[48px]"
                >
                  {creatingCategory ? "..." : "Crear"}
                </button>
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setCategory(categories[0].name); }}
                    className="text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="Descripcion del gasto..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Metodo de Pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white dark:bg-gray-800 text-primary dark:text-white transition-shadow text-base"
              required
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              {saving ? "Guardando..." : editingExpense ? "Guardar" : "Agregar"}
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
