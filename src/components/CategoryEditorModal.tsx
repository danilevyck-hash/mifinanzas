"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Category } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdated: () => void;
};

const COLOR_PALETTE = [
  "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#5AC8FA",
  "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#A2845E",
  "#8E8E93", "#1C1C1E",
];

const EMOJI_OPTIONS = [
  "🍔", "🛒", "🚗", "🏠", "💊", "👕", "🎬", "📱", "✈️", "🎓",
  "💼", "💪", "🐶", "💝", "🎁", "📚", "☕", "🍺", "💄", "👶",
  "⚽", "🎵", "💡", "🔧", "🚿", "🧹", "📌", "💳", "💰", "🎯",
];

export default function CategoryEditorModal({ isOpen, onClose, categories, onUpdated }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [busyName, setBusyName] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [newIcon, setNewIcon] = useState(EMOJI_OPTIONS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useBodyScrollLock(isOpen);

  if (!isOpen || !mounted) return null;

  const enabledNames = new Set(categories.map((c) => c.name));
  const isDefault = (name: string) => DEFAULT_CATEGORIES.some((d) => d.name === name);

  const handleToggle = async (name: string, enable: boolean) => {
    setBusyName(name);
    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name, enabled: enable }),
      });
      if (res.ok) {
        toast(enable ? "Categoría activada" : "Categoría desactivada");
        onUpdated();
      } else {
        const data = await res.json();
        toast(data.error || "Error", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setBusyName(null);
    }
  };

  const handleAddCustom = async () => {
    if (!newName.trim()) return toast("Nombre requerido", "error");
    setBusyName("__new");
    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), color: newColor, icon: newIcon, custom: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Categoría creada");
        setShowAdd(false);
        setNewName("");
        setNewColor(COLOR_PALETTE[0]);
        setNewIcon(EMOJI_OPTIONS[0]);
        onUpdated();
      } else {
        toast(data.error || "Error", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setBusyName(null);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon || EMOJI_OPTIONS[0]);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setBusyName("__edit");
    try {
      const res = await authFetch("/api/categories", {
        method: "PUT",
        body: JSON.stringify({ id: editingId, name: editName.trim(), color: editColor, icon: editIcon }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Categoría actualizada");
        setEditingId(null);
        onUpdated();
      } else {
        toast(data.error || "Error", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setBusyName(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyName("__delete");
    try {
      const res = await authFetch("/api/categories", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast("Categoría eliminada");
        setConfirmDeleteId(null);
        onUpdated();
      } else {
        const data = await res.json();
        toast(data.error || "Error", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setBusyName(null);
    }
  };

  // Show predefined categories that user hasn't activated
  const inactiveDefaults = DEFAULT_CATEGORIES.filter((d) => !enabledNames.has(d.name));

  return createPortal(
    <div
      className="fixed inset-0 bg-[#F2F2F7] dark:bg-[#000] z-[9999] animate-fade-in"
      style={{ height: "100dvh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 pt-14 pb-3 border-b border-[#C6C6C8]/30 dark:border-gray-700/50 shrink-0 bg-white dark:bg-[#1C1C1E]">
          <div className="min-w-[70px]" />
          <h2 className="text-[17px] font-semibold text-primary dark:text-white">Categorías</h2>
          <button onClick={onClose} className="text-[17px] text-[#007AFF] font-semibold min-w-[70px] text-right min-h-[44px]">Listo</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Add custom button / form */}
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full bg-[#007AFF] text-white font-semibold py-3 rounded-xl text-[15px] min-h-[44px]"
            >
              + Nueva categoría
            </button>
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 space-y-3 border border-blue-500/30">
              <h3 className="text-[15px] font-semibold text-primary dark:text-white">Nueva categoría</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre"
                maxLength={30}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-base bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#8E8E93] mb-2">Emoji</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewIcon(e)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${newIcon === e ? "bg-blue-500/10 ring-2 ring-blue-500" : "bg-gray-100 dark:bg-gray-800"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#8E8E93] mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-black" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setNewName(""); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-primary dark:text-white font-semibold py-3 rounded-xl text-[15px] min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={busyName === "__new" || !newName.trim()}
                  className="flex-1 bg-[#007AFF] text-white font-semibold py-3 rounded-xl text-[15px] disabled:opacity-50 min-h-[44px]"
                >
                  {busyName === "__new" ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          )}

          {/* Active categories */}
          {categories.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#8E8E93] mb-2 px-1">Tus categorías</p>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isConfirmingDelete = confirmDeleteId === cat.id;

                  if (isEditing) {
                    return (
                      <div key={cat.id} className="p-4 space-y-3 bg-blue-50/30 dark:bg-blue-500/5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={30}
                          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-base bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="grid grid-cols-10 gap-1.5">
                          {EMOJI_OPTIONS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setEditIcon(e)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${editIcon === e ? "bg-blue-500/10 ring-2 ring-blue-500" : "bg-gray-100 dark:bg-gray-800"}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-8 h-8 rounded-full ${editColor === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-black" : ""}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-primary dark:text-white font-semibold py-3 rounded-xl text-[15px] min-h-[44px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={busyName === "__edit"}
                            className="flex-1 bg-[#007AFF] text-white font-semibold py-3 rounded-xl text-[15px] disabled:opacity-50 min-h-[44px]"
                          >
                            {busyName === "__edit" ? "..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isConfirmingDelete) {
                    return (
                      <div key={cat.id} className="p-4 space-y-3 bg-red-50/30 dark:bg-red-500/5">
                        <p className="text-[14px] text-primary dark:text-white text-center">
                          ¿Eliminar &ldquo;{cat.name}&rdquo;? Los gastos existentes mantienen el nombre pero la categoría se quita de la lista.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-primary dark:text-white font-semibold py-3 rounded-xl text-[15px] min-h-[44px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            disabled={busyName === "__delete"}
                            className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl text-[15px] disabled:opacity-50 min-h-[44px]"
                          >
                            {busyName === "__delete" ? "..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-[15px] font-medium text-primary dark:text-white truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#007AFF]"
                          aria-label="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(cat.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500"
                          aria-label="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inactive default categories — show as "+ Activar" buttons */}
          {inactiveDefaults.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#8E8E93] mb-2 px-1">Categorías sugeridas</p>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {inactiveDefaults.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleToggle(cat.name, true)}
                    disabled={busyName === cat.name}
                    className="w-full flex items-center justify-between p-3 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg opacity-50 shrink-0"
                        style={{ backgroundColor: cat.color + "20" }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-[15px] font-medium text-gray-400 dark:text-gray-500">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#007AFF] font-semibold pr-1">+ Activar</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
