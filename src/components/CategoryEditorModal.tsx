"use client";

import { useState } from "react";
import { Category } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdated: () => void;
};

export default function CategoryEditorModal({ isOpen, onClose, categories, onUpdated }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [togglingName, setTogglingName] = useState<string | null>(null);

  if (!isOpen) return null;

  const enabledNames = new Set(categories.map((c) => c.name));

  const handleToggle = async (name: string, enable: boolean) => {
    setTogglingName(name);
    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name, enabled: enable }),
      });
      if (res.ok) {
        toast(enable ? "Categoria activada" : "Categoria desactivada");
        onUpdated();
      } else {
        const data = await res.json();
        toast(data.error || "Error", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setTogglingName(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30 dark:border-gray-700/50">
          <div className="min-w-[70px]" />
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">Categorias</h2>
          <button onClick={onClose} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right">Listo</button>
        </div>
        <div className="px-5 pt-3 pb-2">
          <p className="text-[13px] text-[#8E8E93] dark:text-gray-500">Activa o desactiva las categorias que necesites</p>
        </div>
        <div className="p-5 pt-2 space-y-1">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isEnabled = enabledNames.has(cat.name);
            const isToggling = togglingName === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => !isToggling && handleToggle(cat.name, !isEnabled)}
                disabled={isToggling}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: cat.color + "20" }}
                  >
                    {cat.icon}
                  </span>
                  <span className={`text-[15px] font-medium ${isEnabled ? "text-primary dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                    {cat.name}
                  </span>
                </div>
                <div className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors ${
                  isToggling ? "opacity-50" : ""
                } ${isEnabled ? "bg-[#34C759]" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${
                    isEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
