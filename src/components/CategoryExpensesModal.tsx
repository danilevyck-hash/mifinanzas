"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PersonalExpense, getCategoryIcon } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  expenses: PersonalExpense[];
  iconMap: Record<string, string>;
  colorMap: Record<string, string>;
  todayStr: string;
  onSelectExpense?: (e: PersonalExpense) => void;
};

export default function CategoryExpensesModal({
  isOpen, onClose, category, expenses, iconMap, colorMap, todayStr, onSelectExpense,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useBodyScrollLock(isOpen);

  const filtered = useMemo(
    () => expenses.filter((e) => e.category === category)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [expenses, category]
  );

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const grouped = useMemo(() => {
    const groups: Record<string, PersonalExpense[]> = {};
    filtered.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
        total: items.reduce((sum, e) => sum + e.amount, 0),
      }));
  }, [filtered]);

  if (!isOpen || !mounted) return null;

  const icon = iconMap[category] || getCategoryIcon(category);
  const color = colorMap[category] || "#6B7280";

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F2F2F7] dark:bg-[#000] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col animate-slide-up"
        style={{ maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl shrink-0">
          {/* Drag handle (mobile only) */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-9 h-1 rounded-full bg-[#C6C6C8] dark:bg-gray-600" />
          </div>
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <div className="min-w-[70px]" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <h2 className="text-[17px] font-semibold text-primary dark:text-white truncate max-w-[200px]">
                {icon} {category}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right min-h-[44px]"
            >
              Listo
            </button>
          </div>
          {/* Total */}
          <div className="px-5 pb-4 text-center">
            <p className="text-[28px] font-bold text-primary dark:text-white tabular-nums leading-tight">
              {formatCurrency(total)}
            </p>
            <p className="text-[13px] text-[#8E8E93] mt-0.5">
              {filtered.length} gasto{filtered.length !== 1 ? "s" : ""} este mes
            </p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ WebkitOverflowScrolling: "touch" }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[15px] text-[#8E8E93]">Sin gastos en esta categoria</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <p className="text-[13px] font-medium text-[#8E8E93] uppercase px-1 mb-1.5">
                  {group.date === todayStr ? "Hoy" : formatDate(group.date)} · {formatCurrency(group.total)}
                </p>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
                  {group.items.map((e, i) => (
                    <div key={e.id}>
                      {i > 0 && <div className="border-t border-[#C6C6C8]/30 dark:border-gray-700/50 ml-4" />}
                      <button
                        type="button"
                        onClick={() => onSelectExpense?.(e)}
                        className="w-full flex items-center py-3 px-4 active:bg-[#E5E5EA]/50 dark:active:bg-gray-800/50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          {e.notes ? (
                            <p className="text-[15px] text-primary dark:text-white truncate">{e.notes}</p>
                          ) : (
                            <p className="text-[15px] text-[#8E8E93] italic">Sin notas</p>
                          )}
                          <p className="text-[13px] text-[#8E8E93]">{e.payment_method}</p>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-[15px] font-semibold text-primary dark:text-white tabular-nums">
                            {formatCurrency(e.amount)}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
