"use client";

import { useState, useEffect } from "react";
import { Category, DEFAULT_COLORS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

const COMMON_EMOJIS = [
  "🏠", "🚗", "🍔", "🛒", "💊", "🎮", "👕", "🛍️",
  "📚", "💻", "⚡", "📱", "💪", "🐾", "✈️", "💰",
  "📈", "🎬", "☕", "🍕", "🏥", "🎵", "🔧", "📌",
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdated: () => void;
};

export default function CategoryEditorModal({ isOpen, onClose, categories, onUpdated }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [editColors, setEditColors] = useState<Record<number, string>>({});
  const [editIcons, setEditIcons] = useState<Record<number, string>>({});
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [showIconPicker, setShowIconPicker] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const colors: Record<number, string> = {};
      const icons: Record<number, string> = {};
      categories.forEach((cat) => {
        colors[cat.id] = cat.color;
        icons[cat.id] = cat.icon || "";
      });
      setEditColors(colors);
      setEditIcons(icons);
      setShowColorPicker(null);
      setShowIconPicker(null);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSave = async (catId: number) => {
    setSavingId(catId);
    try {
      const res = await authFetch("/api/categories", {
        method: "PUT",
        body: JSON.stringify({
          id: catId,
          color: editColors[catId],
          icon: editIcons[catId] || null,
        }),
      });
      if (res.ok) {
        toast("Categoria actualizada");
        onUpdated();
      } else {
        const data = await res.json();
        toast(data.error || "Error al guardar", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl dark:shadow-gray-900/20 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar categorias</h2>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-3">
                {/* Color swatch */}
                <button
                  onClick={() => setShowColorPicker(showColorPicker === cat.id ? null : cat.id)}
                  className="w-8 h-8 rounded-full shrink-0 border-2 border-white dark:border-gray-600 shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: editColors[cat.id] || cat.color }}
                />
                {/* Icon */}
                <button
                  onClick={() => setShowIconPicker(showIconPicker === cat.id ? null : cat.id)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-lg shrink-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {editIcons[cat.id] || "📌"}
                </button>
                <span className="text-sm font-medium text-primary dark:text-white flex-1 truncate">{cat.name}</span>
                <button
                  onClick={() => handleSave(cat.id)}
                  disabled={savingId === cat.id}
                  className="bg-accent hover:bg-accent-light disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors min-h-[32px]"
                >
                  {savingId === cat.id ? "..." : "Guardar"}
                </button>
              </div>
              {/* Color picker */}
              {showColorPicker === cat.id && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setEditColors((prev) => ({ ...prev, [cat.id]: color }));
                        setShowColorPicker(null);
                      }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        editColors[cat.id] === color ? "border-primary dark:border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
              {/* Icon picker */}
              {showIconPicker === cat.id && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setEditIcons((prev) => ({ ...prev, [cat.id]: emoji }));
                        setShowIconPicker(null);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                        editIcons[cat.id] === emoji ? "bg-gray-200 dark:bg-gray-600 ring-2 ring-accent" : "bg-white dark:bg-gray-700"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
