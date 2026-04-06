import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: number;
  username: string;
  display_name: string;
};

export type PersonalExpense = {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  created_at?: string;
};

export type Category = {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon?: string;
};

export const PAYMENT_METHODS = [
  "Yappy",
  "ACH",
  "Tarjeta de Crédito",
] as const;

export type CategoryBudget = {
  id: string;
  user_id: number;
  category: string;
  budget_amount: number;
  month: string;
  created_at?: string;
  updated_at?: string;
};

export type RecurringExpense = {
  id: string;
  user_id: number;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  day_of_month: number;
  is_active: boolean;
  created_at?: string;
};

export type Income = {
  id: string;
  user_id: number;
  date: string;
  amount: number;
  source: string;
  notes?: string;
  is_recurring: boolean;
  created_at?: string;
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Casa": "\u{1F3E0}", "Hogar": "\u{1F3E0}", "Alquiler": "\u{1F3E0}",
  "Carro": "\u{1F697}", "Auto": "\u{1F697}", "Transporte": "\u{1F697}",
  "Comida": "\u{1F354}", "Restaurante": "\u{1F354}", "Mercado": "\u{1F6D2}",
  "Salud": "\u{1F48A}", "Medicina": "\u{1F48A}",
  "Entretenimiento": "\u{1F3AE}", "Ocio": "\u{1F3AE}",
  "Ropa": "\u{1F455}", "Shopping": "\u{1F6CD}\u{FE0F}",
  "Educacion": "\u{1F4DA}", "Tecnologia": "\u{1F4BB}",
  "Servicios": "\u26A1", "Internet": "\u{1F4F1}",
  "Gym": "\u{1F4AA}", "Deporte": "\u{1F4AA}",
  "Mascotas": "\u{1F43E}", "Viaje": "\u2708\u{FE0F}",
  "Ahorro": "\u{1F4B0}", "Inversiones": "\u{1F4C8}",
};

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || "\u{1F4CC}";
}

export const DEFAULT_COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#6B7280", "#EC4899", "#14B8A6",
  "#F97316", "#06B6D4",
];
