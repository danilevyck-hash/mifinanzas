import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_month", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("recurring_expenses")
    .insert([{
      user_id: userId,
      amount: body.amount,
      category: body.category,
      notes: body.notes || null,
      payment_method: body.payment_method,
      day_of_month: body.day_of_month,
      is_active: body.is_active ?? true,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { id } = body;

  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.category !== undefined) updates.category = body.category;
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.payment_method !== undefined) updates.payment_method = body.payment_method;
  if (body.day_of_month !== undefined) updates.day_of_month = body.day_of_month;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabaseAdmin
    .from("recurring_expenses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await request.json();

  const { error } = await supabaseAdmin
    .from("recurring_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
