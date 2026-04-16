import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-initialize: if user has 0 categories, insert all defaults
  if (!data || data.length === 0) {
    const toInsert = DEFAULT_CATEGORIES.map((c) => ({
      user_id: userId,
      name: c.name,
      color: c.color,
      icon: c.icon,
    }));
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("categories")
      .insert(toInsert)
      .select();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json(inserted || []);
  }

  return NextResponse.json(data);
}

// POST: toggle pre-defined OR create custom category
// Body shape A (toggle default): { name, enabled }
// Body shape B (create custom):  { name, color, icon, custom: true }
export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, enabled, color, icon, custom } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }

  const cleanName = name.trim();

  // CREATE CUSTOM CATEGORY
  if (custom) {
    if (!color || !icon) {
      return NextResponse.json({ error: "Falta color o icono" }, { status: 400 });
    }
    // Check if name already exists (case-insensitive)
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .ilike("name", cleanName);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Ya existe una categoria con ese nombre" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([{ user_id: userId, name: cleanName, color, icon }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // TOGGLE PRE-DEFINED CATEGORY
  const defaultCat = DEFAULT_CATEGORIES.find((c) => c.name === cleanName);
  if (!defaultCat) return NextResponse.json({ error: "Categoria no valida" }, { status: 400 });

  if (enabled) {
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", cleanName)
      .maybeSingle();

    if (existing) return NextResponse.json(existing);

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([{ user_id: userId, name: defaultCat.name, color: defaultCat.color, icon: defaultCat.icon }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("name", cleanName);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
}

// PUT: rename category + migrate all expenses to the new name + update icon/color
// Body: { id, name, color?, icon? }
export async function PUT(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { id, name, color, icon } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  if (!name || !name.trim()) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });

  const cleanName = name.trim();

  // Get the current name
  const { data: current, error: getErr } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (getErr || !current) return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });

  const oldName = current.name;

  // If name is changing, check no conflict
  if (oldName !== cleanName) {
    const { data: conflict } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", cleanName)
      .neq("id", id);

    if (conflict && conflict.length > 0) {
      return NextResponse.json({ error: "Ya existe una categoria con ese nombre" }, { status: 400 });
    }
  }

  const updates: Record<string, unknown> = { name: cleanName };
  if (color) updates.color = color;
  if (icon) updates.icon = icon;

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Migrate all expenses with the old name → new name
  if (oldName !== cleanName) {
    await supabaseAdmin
      .from("personal_expenses")
      .update({ category: cleanName })
      .eq("user_id", userId)
      .eq("category", oldName);

    // Also migrate budgets and recurring
    await supabaseAdmin
      .from("category_budgets")
      .update({ category: cleanName })
      .eq("user_id", userId)
      .eq("category", oldName);

    await supabaseAdmin
      .from("recurring_expenses")
      .update({ category: cleanName })
      .eq("user_id", userId)
      .eq("category", oldName);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
