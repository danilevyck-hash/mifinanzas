import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { month } = body; // "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Mes invalido (YYYY-MM)" }, { status: 400 });
  }

  // Get active recurring expenses
  const { data: recurring, error: recError } = await supabaseAdmin
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (recError) return NextResponse.json({ error: recError.message }, { status: 500 });
  if (!recurring || recurring.length === 0) {
    return NextResponse.json({ created: 0, message: "No hay gastos recurrentes activos" });
  }

  // Get existing expenses for that month
  const fromDate = `${month}-01`;
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const toDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const { data: existing, error: exError } = await supabaseAdmin
    .from("personal_expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (exError) return NextResponse.json({ error: exError.message }, { status: 500 });

  let created = 0;

  for (const rec of recurring) {
    const day = Math.min(rec.day_of_month, lastDay);
    const expenseDate = `${month}-${String(day).padStart(2, "0")}`;

    // Check if already exists
    const alreadyExists = (existing || []).some(
      (e: { category: string; amount: number; date: string }) =>
        e.category === rec.category &&
        e.amount === rec.amount &&
        e.date === expenseDate
    );

    if (!alreadyExists) {
      const { error: insertError } = await supabaseAdmin
        .from("personal_expenses")
        .insert([{
          user_id: userId,
          date: expenseDate,
          amount: rec.amount,
          category: rec.category,
          notes: rec.notes || null,
          payment_method: rec.payment_method,
        }]);

      if (!insertError) created++;
    }
  }

  return NextResponse.json({ created, message: `${created} gasto(s) creado(s)` });
}
