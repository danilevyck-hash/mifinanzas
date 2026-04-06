"use client";

import { useState, useEffect } from "react";
import { ACCENT_COLORS, applyAccentColor } from "@/lib/accent";

export default function ThemeCustomizer() {
  const [selected, setSelected] = useState("#6366F1");

  useEffect(() => {
    const stored = localStorage.getItem("mifinanzas_accent");
    if (stored && ACCENT_COLORS.find(c => c.value === stored)) {
      setSelected(stored);
    }
  }, []);

  const handleSelect = (color: string) => {
    setSelected(color);
    applyAccentColor(color);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Color de acento
      </h3>
      <div className="flex gap-3 flex-wrap">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => handleSelect(c.value)}
            className="relative w-10 h-10 rounded-full transition-transform active:scale-90 focus:outline-none"
            style={{ backgroundColor: c.value }}
            aria-label={c.name}
          >
            {selected === c.value && (
              <svg
                className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted dark:text-gray-500 mt-2">
        {ACCENT_COLORS.find(c => c.value === selected)?.name || "Indigo"}
      </p>
    </div>
  );
}
