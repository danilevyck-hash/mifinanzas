import { supabaseAdmin } from "@/lib/supabase-server";
import { createToken } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contrasena requeridos" }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, username, display_name, password")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Usuario o contrasena incorrectos" }, { status: 401 });
  }

  let passwordValid = false;

  if (user.password.startsWith("$2")) {
    passwordValid = await bcrypt.compare(password, user.password);
  } else {
    passwordValid = user.password === password;
    if (passwordValid) {
      const hash = await bcrypt.hash(password, 10);
      await supabaseAdmin.from("users").update({ password: hash }).eq("id", user.id);
    }
  }

  if (!passwordValid) {
    return NextResponse.json({ error: "Usuario o contrasena incorrectos" }, { status: 401 });
  }

  const token = createToken(user.id);

  return NextResponse.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    token,
  });
}
