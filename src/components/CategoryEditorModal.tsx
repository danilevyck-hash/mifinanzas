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
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const [showIconPicker, setShowIconPicker] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const colors: Record<number, string> = {};
      const icons: Record<number, string> = {};
      const names: Record<number, string> = {};
      categories.forEach((cat) => {
        colors[cat.id] = cat.color;
        icons[cat.id] = cat.icon || "";
        names[cat.id] = cat.name;
      });
      setEditColors(colors);
      setEditIcons(icons);
      setEditNames(names);
      setShowColorPicker(null);
      setShowIconPicker(null);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSave = async (catId: number) => {
    const cat = categories.find((c) => c.id === catId);
    const nameChanged = cat && editNames[catId] && editNames[catId] !== cat.name;
    setSavingId(catId);
    try {
      const payload: Record<string, unknown> = {
        id: catId,
        color: editColors[catId],
        icon: editIcons[catId] || null,
      };
      if (nameChanged) payload.new_name = editNames[catId];
      const res = await authFetch("/api/categories", {
        method: "PUT",
        body: JSON.stringify(payload),
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

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const colorIdx = categories.length % DEFAULT_COLORS.length;
      const res = await authFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCatName.trim(), color: DEFAULT_COLORS[colorIdx] }),
      });
      if (res.ok) {
        toast("Categoria creada");
        setNewCatName("");
        onUpdated();
      } else {
        const data = await res.json();
        toast(data.error || "Error al crear", "error");
      }
    } catch { toast("Error de conexion", "error"); }
    finally { setAddingCat(false); }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm("Eliminar esta categoria? Los gastos asociados mantendran el nombre.")) return;
    try {
      const res = await authFetch("/api/categories", {
        method: "DELETE",
        body: JSON.stringify({ id: catId }),
      });
      if (res.ok) { toast("Categoria eliminada"); onUpdated(); }
      else toast("Error al eliminar", "error");
    } catch { toast("Error de conexion", "error"); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl  w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorias</h2>
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
                  className="w-8 h-8 rounded-full shrink-0 border-2 border-white dark:border-gray-600  transition-transform hover:scale-110"
                  style={{ backgroundColor: editColors[cat.id] || cat.color }}
                />
                {/* Icon */}
                <button
                  onClick={() => setShowIconPicker(showIconPicker === cat.id ? null : cat.id)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-lg shrink-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {editIcons[cat.id] || "📌"}
                </button>
                <input
                  type="text"
                  value={editNames[cat.id] || ""}
                  onChange={(e) => setEditNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  className="flex-1 min-w-0 text-sm font-medium text-primary dark:text-white bg-transparent border-b border-transparent focus:border-blue-500 outline-none px-1 py-0.5"
                />
                <button
                  onClick={() => handleSave(cat.id)}
                  disabled={savingId === cat.id}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors min-h-[32px]"
                >
                  {savingId === cat.id ? "..." : "Guardar"}
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-400 hover:text-red-500 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {/* Rename note */}
              {editNames[cat.id] && editNames[cat.id] !== cat.name && (
                <p className="text-xs text-amber-600 dark:text-amber-400 px-1">Los gastos existentes se migraran al nuevo nombre</p>
              )}
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
                        editIcons[cat.id] === emoji ? "bg-gray-200 dark:bg-gray-600 ring-2 ring-blue-500" : "bg-white dark:bg-gray-700"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add new category */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nueva categoria..."
              />
              <button
                onClick={handleAddCategory}
                disabled={addingCat || !newCatName.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors min-h-[40px]"
              >
                {addingCat ? "..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
