import { supabaseAdmin } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { display_name, username, password, email } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contrasena requeridos" },
      { status: 400 }
    );
  }

  if (!display_name) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contrasena debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  // Check if username already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Ese usuario ya existe" },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const insertData: Record<string, string> = { username, password: hash, display_name };
  if (email) insertData.email = email;

  const { error } = await supabaseAdmin
    .from("users")
    .insert([insertData]);

  if (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la cuenta" },
      { status: 500 }
    );
  }

  // Send welcome email if provided
  if (email) {
    await sendEmail({
      to: email,
      subject: "Bienvenido a MiFinanzas",
      html: `<h2>Hola ${display_name}!</h2><p>Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesion con tu usuario: <strong>${username}</strong></p><p>— MiFinanzas</p>`,
    });
  }

  return NextResponse.json({ message: "Cuenta creada exitosamente" });
}
