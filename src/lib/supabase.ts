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

export const DEFAULT_COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#6B7280", "#EC4899", "#14B8A6",
  "#F97316", "#06B6D4",
];
