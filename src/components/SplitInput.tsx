"use client";

import { useState } from "react";

type Props = {
  amount: number;
  onSplitChange: (splitCount: number) => void;
};

export default function SplitInput({ amount, onSplitChange }: Props) {
  const [splitCount, setSplitCount] = useState(1);

  const handleChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    setSplitCount(clamped);
    onSplitChange(clamped);
  };

  const perPerson = splitCount > 0 ? amount / splitCount : amount;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary dark:text-white font-medium">Dividir entre</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChange(splitCount - 1)}
            disabled={splitCount <= 1}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-primary dark:text-white font-bold disabled:opacity-30 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-semibold text-primary dark:text-white">{splitCount}</span>
          <button
            type="button"
            onClick={() => handleChange(splitCount + 1)}
            disabled={splitCount >= 10}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-primary dark:text-white font-bold disabled:opacity-30 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      {splitCount > 1 && (
        <div className="flex items-center justify-between text-xs text-muted dark:text-gray-400">
          <span>Total: ${amount.toFixed(2)}</span>
          <span className="font-medium text-accent">Tu parte: ${perPerson.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
