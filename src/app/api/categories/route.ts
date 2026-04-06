import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getCategoryIcon } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const icon = body.icon || getCategoryIcon(body.name);

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert([{ user_id: userId, name: body.name, color: body.color, icon }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { id, color, icon, new_name } = body;

  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  // If renaming, migrate expenses and budgets first
  if (new_name) {
    const { data: current } = await supabaseAdmin
      .from("categories")
      .select("name")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (current && current.name !== new_name) {
      // Migrate expenses
      await supabaseAdmin
        .from("personal_expenses")
        .update({ category: new_name })
        .eq("user_id", userId)
        .eq("category", current.name);

      // Migrate budgets
      await supabaseAdmin
        .from("category_budgets")
        .update({ category: new_name })
        .eq("user_id", userId)
        .eq("category", current.name);
    }
  }

  const updates: Record<string, string> = {};
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;
  if (new_name) updates.name = new_name;

  const { data, error } = await supabaseAdmin
    .from("categories")
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
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
