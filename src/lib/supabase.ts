import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: number;
  username: string;
  display_name: string;
  email?: string;
};

export type PersonalExpense = {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  category: string;
  notes?: string;
  payment_method: string;
  receipt_url?: string;
  subcategory?: string;
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

export const CATEGORY_ICONS: Record<string, string> = {
  // Default categories
  "Comida": "\u{1F354}", "Supermercado": "\u{1F6D2}", "Transporte": "\u{1F697}",
  "Hogar": "\u{1F3E0}", "Salud": "\u{1F48A}", "Entretenimiento": "\u{1F3AE}",
  "Ropa": "\u{1F455}", "Educación": "\u{1F4DA}", "Servicios": "\u26A1",
  "Personal": "\u{1F486}", "Mascotas": "\u{1F43E}", "Viajes": "\u2708\u{FE0F}",
  "Regalos": "\u{1F381}", "Otros": "\u{1F4CC}",
  // Legacy/backward compat
  "Casa": "\u{1F3E0}", "Alquiler": "\u{1F3E0}",
  "Carro": "\u{1F697}", "Auto": "\u{1F697}",
  "Restaurante": "\u{1F354}", "Mercado": "\u{1F6D2}",
  "Medicina": "\u{1F48A}", "Ocio": "\u{1F3AE}",
  "Shopping": "\u{1F6CD}\u{FE0F}", "Educacion": "\u{1F4DA}",
  "Tecnologia": "\u{1F4BB}", "Internet": "\u{1F4F1}",
  "Gym": "\u{1F4AA}", "Deporte": "\u{1F4AA}",
  "Viaje": "\u2708\u{FE0F}", "Ahorro": "\u{1F4B0}", "Inversiones": "\u{1F4C8}",
};

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || "\u{1F4CC}";
}

export const DEFAULT_COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#6B7280", "#EC4899", "#14B8A6",
  "#F97316", "#06B6D4",
];
