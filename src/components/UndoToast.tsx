"use client";

import { useEffect } from "react";

type Props = {
  expense: { id: number; date: string; amount: number; category: string; notes?: string; payment_method: string };
  onUndo: () => void;
  onDismiss: () => void;
};

export default function UndoToast({ expense, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[65] w-[90%] max-w-sm">
      <div className="flex items-center justify-between gap-3 bg-gray-900 dark:bg-gray-100 rounded-xl px-4 py-3 shadow-lg animate-slide-up">
        <span className="text-sm font-medium text-white dark:text-gray-900">
          Gasto eliminado
        </span>
        <button
          onClick={onUndo}
          className="text-sm font-bold text-amber-400 dark:text-amber-600 hover:underline whitespace-nowrap"
        >
          Deshacer
        </button>
      </div>
    </div>
  );
}
