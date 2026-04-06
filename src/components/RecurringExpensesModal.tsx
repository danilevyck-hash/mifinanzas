"use client";

import { useState, useEffect } from "react";
import { RecurringExpense, Category, PAYMENT_METHODS, getCategoryIcon } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/format";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
};

export default function RecurringExpensesModal({ isOpen, onClose, categories }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/recurring-expenses");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      toast("Error al cargar gastos recurrentes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setShowForm(false);
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setAmount("");
    setCategory(categories.length > 0 ? categories[0].name : "");
    setNotes("");
    setPaymentMethod(PAYMENT_METHODS[0]);
    setDayOfMonth("1");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/recurring-expenses", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount) || 0,
          category,
          notes: notes.trim() || undefined,
          payment_method: paymentMethod,
          day_of_month: parseInt(dayOfMonth) || 1,
        }),
      });
      if (res.ok) {
        toast("Gasto recurrente agregado");
        setShowForm(false);
        resetForm();
        fetchItems();
      } else {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: RecurringExpense) => {
    try {
      const res = await authFetch("/api/recurring-expenses", {
        method: "PUT",
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
        );
      }
    } catch {
      toast("Error al actualizar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authFetch("/api/recurring-expenses", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast("Gasto recurrente eliminado");
      }
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30 dark:border-gray-700/50">
          <div className="min-w-[70px]" />
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">Gastos Recurrentes</h2>
          <button onClick={onClose} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right">Listo</button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <p className="text-center text-muted py-4">Cargando...</p>
          ) : items.length === 0 && !showForm ? (
            <p className="text-center text-muted py-4">No hay gastos recurrentes</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    item.is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                >
                  <span className="text-xl">{getCategoryIcon(item.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-muted">dia {item.day_of_month}</span>
                    </div>
                    <div className="text-sm text-muted truncate">
                      {item.category} &middot; {item.payment_method}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-muted truncate">{item.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(item)}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                      item.is_active ? "text-blue-500" : "text-gray-300"
                    }`}
                    title={item.is_active ? "Desactivar" : "Activar"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {item.is_active ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Dia del mes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow text-base"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Metodo de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow text-base"
                  required
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
                  placeholder="Descripcion..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
                >
                  {saving ? "Guardando..." : "Agregar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => { setShowForm(true); setCategory(categories.length > 0 ? categories[0].name : ""); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              + Agregar gasto recurrente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
