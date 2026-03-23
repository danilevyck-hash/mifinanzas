import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PersonalExpense = {
  id: number;
  date: string;
  amount: number;
  category: string;
  subcategory?: string;
  payment_method: string;
  created_at?: string;
};

export const EXPENSE_CATEGORIES = [
  "Restaurante",
  "Super",
  "Carro",
  "Casa",
  "Mensualidad",
  "Otros Gastos",
] as const;

export const PAYMENT_METHODS = [
  "Yappy",
  "ACH",
  "Tarjeta de Crédito",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Restaurante: "#EF4444",
  Super: "#3B82F6",
  Carro: "#10B981",
  Casa: "#F59E0B",
  Mensualidad: "#8B5CF6",
  "Otros Gastos": "#6B7280",
};
