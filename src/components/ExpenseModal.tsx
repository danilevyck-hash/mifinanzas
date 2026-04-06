"use client";

import { useState, useEffect, useRef } from "react";
import { PersonalExpense, Category, PAYMENT_METHODS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import ReceiptCapture from "./ReceiptCapture";
import ReceiptViewer from "./ReceiptViewer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<PersonalExpense>) => void;
  editingExpense: PersonalExpense | null;
  categories: Category[];
  userId: number;
  saving?: boolean;
  defaultCategory?: string;
  defaultPaymentMethod?: string;
};

export default function ExpenseModal({
  isOpen, onClose, onSave, editingExpense, categories, userId, saving,
  defaultCategory, defaultPaymentMethod,
}: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const notesRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
  const dayBeforeDate = new Date();
  dayBeforeDate.setDate(dayBeforeDate.getDate() - 2);
  const dayBeforeStr = dayBeforeDate.toISOString().split("T")[0];

  // Fetch note suggestions when category changes
  useEffect(() => {
    if (!category || !isOpen) {
      setNoteSuggestions([]);
      return;
    }
    authFetch(`/api/notes-suggestions?category=${encodeURIComponent(category)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setNoteSuggestions(d); })
      .catch(() => {});
  }, [category, isOpen, authFetch]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        notesRef.current &&
        !notesRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setNotes(editingExpense.notes || "");
      setPaymentMethod(editingExpense.payment_method);
      setReceiptUrl(editingExpense.receipt_url);
    } else {
      setDate(todayStr);
      setAmount("");
      // Smart defaults: use saved preference if valid, else first category
      const categoryNames = categories.map((c) => c.name);
      if (defaultCategory && categoryNames.includes(defaultCategory)) {
        setCategory(defaultCategory);
      } else {
        setCategory(categories.length > 0 ? categories[0].name : "");
      }
      setNotes("");
      if (defaultPaymentMethod && (PAYMENT_METHODS as readonly string[]).includes(defaultPaymentMethod)) {
        setPaymentMethod(defaultPaymentMethod);
      } else {
        setPaymentMethod(PAYMENT_METHODS[0]);
      }
      setReceiptUrl(undefined);
    }
    setShowSuggestions(false);
  }, [editingExpense, isOpen, categories, defaultCategory, defaultPaymentMethod, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast("Ingresa un monto", "error");
      return;
    }
    if (!category) {
      toast("Selecciona una categoria", "error");
      return;
    }
    if (!date) {
      toast("Selecciona una fecha", "error");
      return;
    }
    const expense: Partial<PersonalExpense> = {
      user_id: userId,
      date,
      amount: parseFloat(amount) || 0,
      category,
      notes: notes.trim() || undefined,
      payment_method: paymentMethod,
      receipt_url: receiptUrl,
    };
    if (editingExpense) {
      expense.id = editingExpense.id;
    }
    onSave(expense);
  };

  const filteredSuggestions = noteSuggestions.filter(
    (s) => !notes || s.toLowerCase().includes(notes.toLowerCase())
  );

  const dateShortcutClass = (target: string) =>
    `text-xs px-2.5 py-1 rounded-lg transition-colors ${
      date === target
        ? "bg-blue-500 text-white"
        : "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400"
    }`;

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
            {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <button type="submit" disabled={saving} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right disabled:opacity-50">
            {saving ? "..." : "Guardar"}
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Fecha</label>
            <div className="flex gap-2 mb-1.5">
              <button type="button" onClick={() => setDate(todayStr)} className={dateShortcutClass(todayStr)}>
                Hoy
              </button>
              <button type="button" onClick={() => setDate(yesterdayStr)} className={dateShortcutClass(yesterdayStr)}>
                Ayer
              </button>
              <button type="button" onClick={() => setDate(dayBeforeStr)} className={dateShortcutClass(dayBeforeStr)}>
                Anteayer
              </button>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
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
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Categoria</label>
            {categories.length > 0 ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-primary dark:text-white transition-shadow text-base"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted dark:text-gray-400 py-3">Crea categorias en Configuracion</p>
            )}
            {!editingExpense && defaultCategory && category === defaultCategory && (
              <p className="text-[11px] text-[#8E8E93] mt-0.5">Ultima categoria usada</p>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Notas</label>
            <input
              ref={notesRef}
              type="text"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base bg-white dark:bg-gray-800 text-primary dark:text-white"
              placeholder="Descripcion del gasto..."
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="flex flex-wrap gap-1.5 mt-1.5"
              >
                {filteredSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setNotes(s); setShowSuggestions(false); }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400 hover:bg-blue-500 hover:text-white transition-colors truncate max-w-[200px]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">Metodo de Pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-primary dark:text-white transition-shadow text-base"
              required
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <ReceiptCapture
            onCapture={(url) => setReceiptUrl(url)}
            onScanResult={(result) => {
              if (result.amount && !amount) setAmount(result.amount.toString());
              if (result.category) {
                const match = categories.find((c) => c.name.toLowerCase() === result.category.toLowerCase());
                if (match) setCategory(match.name);
              }
              if (result.notes && !notes) setNotes(result.notes);
            }}
            existingUrl={receiptUrl}
            onRemove={() => setReceiptUrl(undefined)}
            onViewFull={(url) => setViewingReceipt(url)}
          />


        </div>
      </form>

      {viewingReceipt && (
        <ReceiptViewer url={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}
    </div>
  );
}
