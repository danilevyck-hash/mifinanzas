"use client";

import { useState, useEffect } from "react";
import { PersonalExpense, Category, PAYMENT_METHODS, DEFAULT_COLORS } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<PersonalExpense>) => void;
  editingExpense: PersonalExpense | null;
  categories: Category[];
  onCategoryCreated: () => void;
  userId: number;
};

export default function ExpenseModal({ isOpen, onClose, onSave, editingExpense, categories, onCategoryCreated, userId }: Props) {
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
    setShowNewCategory(false);
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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name: newCategoryName.trim(), color: DEFAULT_COLORS[colorIdx] }),
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
            {!showNewCategory ? (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white transition-shadow"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="__new__">+ Crear nueva categoría...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
                  placeholder="Nombre de la categoría"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold px-4 rounded-xl transition-colors text-sm"
                >
                  {creatingCategory ? "..." : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCategory(false); setCategory(categories.length > 0 ? categories[0].name : ""); }}
                  className="text-muted hover:text-primary px-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Descripción del gasto..."
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
