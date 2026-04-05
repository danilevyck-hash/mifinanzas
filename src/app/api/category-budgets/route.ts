import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month");
  if (!month) return NextResponse.json({ error: "Falta el mes" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("category_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { category, budget_amount, month } = body;

  if (!category || budget_amount == null || !month) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("category_budgets")
    .upsert(
      { user_id: userId, category, budget_amount, month, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category,month" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
