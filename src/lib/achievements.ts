export const ACHIEVEMENT_TYPES: Record<string, { name: string; emoji: string; description: string }> = {
  first_expense: { name: "Primer gasto", emoji: "🎯", description: "Registraste tu primer gasto" },
  week_streak: { name: "Racha semanal", emoji: "🔥", description: "7 dias registrando gastos" },
  under_budget: { name: "Bajo presupuesto", emoji: "🏆", description: "Mes completo bajo presupuesto" },
  no_delivery: { name: "Sin delivery", emoji: "🍳", description: "5 dias sin gastar en delivery" },
  saver: { name: "Ahorrador", emoji: "💰", description: "Ahorraste 20% vs mes anterior" },
  consistent: { name: "Consistente", emoji: "📊", description: "3 meses seguidos usando la app" },
  budget_master: { name: "Presupuesto master", emoji: "🎓", description: "Configuraste budget en todas las categorias" },
  explorer: { name: "Explorador", emoji: "🗺️", description: "Usaste todas las features de la app" },
};

export type AchievementType = keyof typeof ACHIEVEMENT_TYPES;

export type Achievement = {
  id: number;
  user_id: number;
  type: string;
  earned_at: string;
};
