"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";

type SavingsGoal = {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  is_active: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SavingsGoalsModal({ isOpen, onClose }: Props) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingFundsId, setAddingFundsId] = useState<number | null>(null);
  const [fundsAmount, setFundsAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/savings-goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isOpen) {
      fetchGoals();
      setShowForm(false);
      setAddingFundsId(null);
      setEditingId(null);
    }
  }, [isOpen, fetchGoals]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!name.trim() || isNaN(target) || target <= 0) {
      toast("Completa los campos requeridos", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/savings-goals", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          target_amount: target,
          deadline: deadline || null,
        }),
      });
      if (res.ok) {
        toast("Meta creada");
        setShowForm(false);
        setName("");
        setTargetAmount("");
        setDeadline("");
        fetchGoals();
      } else {
        const data = await res.json();
        toast(data.error || "Error al crear", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFunds = async (goalId: number) => {
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast("Monto invalido", "error");
      return;
    }
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    try {
      const res = await authFetch("/api/savings-goals", {
        method: "PUT",
        body: JSON.stringify({
          id: goalId,
          current_amount: goal.current_amount + amount,
        }),
      });
      if (res.ok) {
        toast("Fondos agregados");
        setAddingFundsId(null);
        setFundsAmount("");
        fetchGoals();
      }
    } catch {
      toast("Error de conexion", "error");
    }
  };

  const handleEdit = async (goalId: number) => {
    const target = parseFloat(editTarget);
    if (!editName.trim() || isNaN(target) || target <= 0) {
      toast("Completa los campos requeridos", "error");
      return;
    }
    try {
      const res = await authFetch("/api/savings-goals", {
        method: "PUT",
        body: JSON.stringify({
          id: goalId,
          name: editName.trim(),
          target_amount: target,
          deadline: editDeadline || null,
        }),
      });
      if (res.ok) {
        toast("Meta actualizada");
        setEditingId(null);
        fetchGoals();
      }
    } catch {
      toast("Error de conexion", "error");
    }
  };

  const handleDelete = async (goalId: number) => {
    try {
      const res = await authFetch("/api/savings-goals", {
        method: "DELETE",
        body: JSON.stringify({ id: goalId }),
      });
      if (res.ok) {
        toast("Meta eliminada");
        fetchGoals();
      }
    } catch {
      toast("Error de conexion", "error");
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct > 80) return "bg-green-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-accent";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl dark:shadow-gray-900/20 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Metas de ahorro</h2>
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
          {loading ? (
            <p className="text-sm text-muted dark:text-gray-400 text-center py-4">Cargando...</p>
          ) : (
            <>
              {goals.length === 0 && !showForm && (
                <p className="text-sm text-muted dark:text-gray-400 text-center py-4">No tienes metas de ahorro aun</p>
              )}
              {goals.map((goal) => {
                const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
                const isEditing = editingId === goal.id;

                if (isEditing) {
                  return (
                    <div key={goal.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                        placeholder="Nombre"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                        placeholder="Monto meta"
                      />
                      <input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(goal.id)}
                          className="flex-1 bg-accent hover:bg-accent-light text-white text-sm font-semibold py-2 rounded-xl transition-colors min-h-[40px]"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold py-2 rounded-xl transition-colors min-h-[40px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={goal.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary dark:text-white">{goal.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(goal.id);
                            setEditName(goal.name);
                            setEditTarget(goal.target_amount.toString());
                            setEditDeadline(goal.deadline || "");
                          }}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-muted dark:text-gray-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted dark:text-gray-400">
                      <span>${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-muted dark:text-gray-400">
                        Fecha limite: {new Date(goal.deadline).toLocaleDateString("es-PA")}
                      </p>
                    )}
                    {/* Add funds */}
                    {addingFundsId === goal.id ? (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={fundsAmount}
                          onChange={(e) => setFundsAmount(e.target.value)}
                          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                          placeholder="Monto a agregar"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddFunds(goal.id)}
                          className="bg-accent hover:bg-accent-light text-white text-sm font-semibold px-4 rounded-xl transition-colors min-h-[40px]"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => { setAddingFundsId(null); setFundsAmount(""); }}
                          className="text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingFundsId(goal.id); setFundsAmount(""); }}
                        className="text-accent hover:text-accent-light text-xs font-medium transition-colors min-h-[36px] flex items-center"
                      >
                        + Agregar fondos
                      </button>
                    )}
                  </div>
                );
              })}

              {/* New goal form */}
              {showForm ? (
                <form onSubmit={handleCreate} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-primary dark:text-white">Nueva meta</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Nombre de la meta"
                    autoFocus
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Monto meta ($)"
                    required
                  />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-primary dark:text-white focus:ring-2 focus:ring-accent outline-none"
                  />
                  <p className="text-xs text-muted dark:text-gray-400">Fecha limite (opcional)</p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors min-h-[40px]"
                    >
                      {saving ? "Creando..." : "Crear meta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold py-2 rounded-xl transition-colors min-h-[40px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-primary dark:text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] text-sm"
                >
                  + Nueva meta de ahorro
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
