import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  const authUserId = getAuthUserId(request);
  if (!authUserId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { current_password } = body;

  const { data: user, error: findErr } = await supabaseAdmin
    .from("users")
    .select("id, password")
    .eq("id", authUserId)
    .single();

  if (findErr || !user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Profile-only updates (name/email) don't need password
  const needsPassword = body.new_password || body.username;
  if (needsPassword) {
    if (!current_password) {
      return NextResponse.json({ error: "Contrasena actual requerida" }, { status: 400 });
    }
    let passwordValid = false;
    if (user.password.startsWith("$2")) {
      passwordValid = await bcrypt.compare(current_password, user.password);
    } else {
      passwordValid = user.password === current_password;
    }
    if (!passwordValid) {
      return NextResponse.json({ error: "Contrasena actual incorrecta" }, { status: 401 });
    }
  }

  const updates: Record<string, string> = {};
  if (body.username) updates.username = body.username;
  if (body.display_name) updates.display_name = body.display_name;
  if (body.new_password) updates.password = await bcrypt.hash(body.new_password, 10);
  if (body.email !== undefined) updates.email = body.email;

  if (body.username) {
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", body.username)
      .neq("id", authUserId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No hay cambios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", authUserId)
    .select("id, username, display_name, email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
