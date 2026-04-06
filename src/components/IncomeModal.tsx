"use client";

import { useState, useEffect } from "react";
import { Income } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

const INCOME_SOURCES = ["Salario", "Freelance", "Alquiler", "Venta", "Otro"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingIncome: Income | null;
};

export default function IncomeModal({ isOpen, onClose, onSave, editingIncome }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingIncome) {
      setDate(editingIncome.date);
      setAmount(editingIncome.amount.toString());
      setSource(editingIncome.source);
      setNotes(editingIncome.notes || "");
      setIsRecurring(editingIncome.is_recurring);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setSource("");
      setNotes("");
      setIsRecurring(false);
    }
  }, [editingIncome, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...(editingIncome ? { id: editingIncome.id } : {}),
        date,
        amount: parseFloat(amount) || 0,
        source: source.trim(),
        notes: notes.trim() || undefined,
        is_recurring: isRecurring,
      };

      const res = await authFetch("/api/income", {
        method: editingIncome ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
        return;
      }

      toast(editingIncome ? "Ingreso actualizado" : "Ingreso agregado");
      onSave();
      onClose();
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  const isPreset = INCOME_SOURCES.includes(source);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl dark:shadow-gray-900/20 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}
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
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Fuente</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {INCOME_SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    source === s
                      ? "bg-accent text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder={isPreset ? source : "Ej: Salario, Freelance, Alquiler..."}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="Descripcion del ingreso..."
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
            <span className="text-sm font-medium text-primary dark:text-white">Ingreso recurrente</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-base"
            >
              {saving ? "Guardando..." : editingIncome ? "Guardar" : "Agregar"}
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
