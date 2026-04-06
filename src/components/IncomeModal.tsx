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
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30 dark:border-gray-700/50">
          <button type="button" onClick={onClose} className="text-[17px] text-[#007AFF] min-w-[70px] text-left">Cancelar</button>
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">
            {editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}
          </h2>
          <button type="submit" disabled={saving} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right disabled:opacity-50">
            {saving ? "..." : "Guardar"}
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
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
                      ? "bg-blue-500 text-white"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
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
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
            <span className="text-sm font-medium text-primary dark:text-white">Ingreso recurrente</span>
          </div>
        </div>
      </form>
    </div>
  );
}
