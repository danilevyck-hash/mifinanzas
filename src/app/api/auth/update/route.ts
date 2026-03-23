import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, current_password } = body;

  // Verify current password
  const { data: user, error: findErr } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .eq("password", current_password)
    .single();

  if (findErr || !user) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
  }

  const updates: Record<string, string> = {};
  if (body.username) updates.username = body.username;
  if (body.display_name) updates.display_name = body.display_name;
  if (body.new_password) updates.password = body.new_password;

  // Check username uniqueness if changing it
  if (body.username) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", body.username)
      .neq("id", id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("id, username, display_name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
