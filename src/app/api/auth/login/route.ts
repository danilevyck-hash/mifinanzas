import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  return NextResponse.json(data);
}
