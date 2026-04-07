import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

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

// Toggle category on/off
export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, enabled } = body;

  if (!name) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });

  const defaultCat = DEFAULT_CATEGORIES.find((c) => c.name === name);
  if (!defaultCat) return NextResponse.json({ error: "Categoria no valida" }, { status: 400 });

  if (enabled) {
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .single();

    if (existing) return NextResponse.json(existing);

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([{ user_id: userId, name: defaultCat.name, color: defaultCat.color, icon: defaultCat.icon }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    // Delete category (expenses keep their category name)
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("user_id", userId)
      .eq("name", name);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
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
