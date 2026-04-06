import { supabaseAdmin } from "@/lib/supabase-server";
import { resetCodes } from "@/lib/reset-codes";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, code, new_password } = await request.json();

  if (!email || !code || !new_password) {
    return NextResponse.json(
      { error: "Todos los campos son requeridos" },
      { status: 400 }
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: "La contrasena debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const stored = resetCodes.get(email.toLowerCase());

  if (!stored) {
    return NextResponse.json(
      { error: "Codigo invalido o expirado" },
      { status: 400 }
    );
  }

  if (Date.now() > stored.expires) {
    resetCodes.delete(email.toLowerCase());
    return NextResponse.json(
      { error: "El codigo ha expirado, solicita uno nuevo" },
      { status: 400 }
    );
  }

  if (stored.code !== code) {
    return NextResponse.json(
      { error: "Codigo incorrecto" },
      { status: 400 }
    );
  }

  // Find user by email
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  // Update password
  const hash = await bcrypt.hash(new_password, 10);
  const { error } = await supabaseAdmin
    .from("users")
    .update({ password: hash })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Error al cambiar la contrasena" },
      { status: 500 }
    );
  }

  // Clear the reset code
  resetCodes.delete(email.toLowerCase());

  return NextResponse.json({ message: "Contrasena cambiada exitosamente" });
}
