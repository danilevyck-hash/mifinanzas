"use client";

import { useState, useEffect } from "react";
import { PersonalExpense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<PersonalExpense>) => void;
  editingExpense: PersonalExpense | null;
};

export default function ExpenseModal({ isOpen, onClose, onSave, editingExpense }: Props) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setSubcategory(editingExpense.subcategory || "");
      setPaymentMethod(editingExpense.payment_method);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setSubcategory("");
      setPaymentMethod(PAYMENT_METHODS[0]);
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Partial<PersonalExpense> = {
      date,
      amount: parseFloat(amount) || 0,
      category,
      subcategory: subcategory.trim() || undefined,
      payment_method: paymentMethod,
    };
    if (editingExpense) {
      expense.id = editingExpense.id;
    }
    onSave(expense);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-primary text-white p-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold">
            {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white transition-shadow"
              required
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Subcategoría</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Ej: gasolina, luz, Netflix..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Método de Pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white transition-shadow"
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
              className="flex-1 bg-accent hover:bg-accent-light text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {editingExpense ? "Guardar" : "Agregar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
