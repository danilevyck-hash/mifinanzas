"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PersonalExpense, Category, PAYMENT_METHODS } from "@/lib/supabase";
import { detectCategory } from "@/lib/default-categories";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { localISO, todayLocalISO } from "@/lib/format";
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
  const [autoDetected, setAutoDetected] = useState(false);
  const [manualCategoryChange, setManualCategoryChange] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const todayStr = todayLocalISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = localISO(yesterdayDate);
  const dayBeforeDate = new Date();
  dayBeforeDate.setDate(dayBeforeDate.getDate() - 2);
  const dayBeforeStr = localISO(dayBeforeDate);

  useBodyScrollLock(isOpen);

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

  // Auto-detect category from notes (300ms debounce)
  const enabledCategoryNames = categories.map((c) => c.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableEnabledNames = JSON.stringify(enabledCategoryNames);

  useEffect(() => {
    if (!isOpen || manualCategoryChange || !notes) {
      if (!notes && autoDetected) setAutoDetected(false);
      return;
    }
    const timer = setTimeout(() => {
      const parsed = JSON.parse(stableEnabledNames) as string[];
      const detected = detectCategory(notes, parsed);
      if (detected) {
        setCategory(detected);
        setAutoDetected(true);
      } else {
        setAutoDetected(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [notes, stableEnabledNames, isOpen, manualCategoryChange, autoDetected]);

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
    setAutoDetected(false);
    setManualCategoryChange(false);
  }, [editingExpense, isOpen, categories, defaultCategory, defaultPaymentMethod, todayStr]);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div
      className="fixed inset-0 bg-[#F2F2F7] dark:bg-[#000] z-[9999] animate-fade-in"
      style={{ height: "100dvh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 pt-14 pb-3 border-b border-[#C6C6C8]/30 dark:border-gray-700/50 shrink-0 bg-white dark:bg-[#1C1C1E]">
          <button type="button" onClick={onClose} className="text-[17px] text-[#007AFF] min-w-[70px] text-left min-h-[44px]">Cancelar</button>
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">
            {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <button type="submit" disabled={saving} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right disabled:opacity-50 min-h-[44px]">
            {saving ? "..." : "Guardar"}
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Monto */}
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
              autoFocus
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-primary dark:text-white">Categoria</label>
              {autoDetected && (
                <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">Auto</span>
              )}
            </div>
            {categories.length > 0 ? (
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setManualCategoryChange(true); setAutoDetected(false); }}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-primary dark:text-white transition-shadow text-base"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted dark:text-gray-400 py-3">Activa categorias en Configuracion</p>
            )}
            {!editingExpense && !autoDetected && defaultCategory && category === defaultCategory && (
              <p className="text-[11px] text-[#8E8E93] mt-0.5">Ultima categoria usada</p>
            )}
          </div>

          {/* Fecha */}
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
          </div>

          {/* Metodo de Pago */}
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

          {/* Notas */}
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

          {/* Recibo */}
          <ReceiptCapture
            onCapture={(url) => setReceiptUrl(url)}
            existingUrl={receiptUrl}
            onRemove={() => setReceiptUrl(undefined)}
            onViewFull={(url) => setViewingReceipt(url)}
          />
        </div>
      </form>

      {viewingReceipt && (
        <ReceiptViewer url={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}
    </div>,
    document.body
  );
}
