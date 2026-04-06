import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { ACHIEVEMENT_TYPES } from "@/lib/achievements";

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Get already earned achievements
  const { data: earned } = await supabaseAdmin
    .from("achievements")
    .select("type")
    .eq("user_id", userId);

  const earnedTypes = new Set((earned || []).map((a: { type: string }) => a.type));
  const newAchievements: string[] = [];

  // Check: first_expense
  if (!earnedTypes.has("first_expense")) {
    const { count } = await supabaseAdmin
      .from("personal_expenses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (count && count >= 1) {
      newAchievements.push("first_expense");
    }
  }

  // Check: week_streak - 7 distinct days with expenses
  if (!earnedTypes.has("week_streak")) {
    const { data: expenses } = await supabaseAdmin
      .from("personal_expenses")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);
    if (expenses) {
      const uniqueDays = new Set(expenses.map((e: { date: string }) => e.date));
      if (uniqueDays.size >= 7) {
        newAchievements.push("week_streak");
      }
    }
  }

  // Check: budget_master - budget set for all categories
  if (!earnedTypes.has("budget_master")) {
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("user_id", userId);
    if (categories && categories.length > 0) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: budgets } = await supabaseAdmin
        .from("category_budgets")
        .select("category")
        .eq("user_id", userId)
        .eq("month", month);
      if (budgets) {
        const budgetCats = new Set(budgets.map((b: { category: string }) => b.category));
        const allHaveBudget = categories.every((c: { name: string }) => budgetCats.has(c.name));
        if (allHaveBudget) {
          newAchievements.push("budget_master");
        }
      }
    }
  }

  // Check: consistent - 3 months with expenses
  if (!earnedTypes.has("consistent")) {
    const { data: expenses } = await supabaseAdmin
      .from("personal_expenses")
      .select("date")
      .eq("user_id", userId);
    if (expenses) {
      const months = new Set(expenses.map((e: { date: string }) => e.date.substring(0, 7)));
      if (months.size >= 3) {
        newAchievements.push("consistent");
      }
    }
  }

  // Insert new achievements
  if (newAchievements.length > 0) {
    const rows = newAchievements.map((type) => ({
      user_id: userId,
      type,
      earned_at: new Date().toISOString(),
    }));
    await supabaseAdmin.from("achievements").insert(rows);
  }

  // Return all achievements including new ones
  const { data: allAchievements } = await supabaseAdmin
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  // Add metadata
  const enriched = (allAchievements || []).map((a: { type: string; id: number; user_id: number; earned_at: string }) => ({
    ...a,
    ...(ACHIEVEMENT_TYPES[a.type] || { name: a.type, emoji: "🏅", description: "" }),
  }));

  return NextResponse.json({ achievements: enriched, new: newAchievements });
}
