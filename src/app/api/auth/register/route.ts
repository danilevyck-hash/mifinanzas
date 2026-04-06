import { supabaseAdmin } from "@/lib/supabase-server";
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

  if (!email) {
    return NextResponse.json(
      { error: "El email es requerido" },
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

  const insertData: Record<string, string> = { username, password: hash, display_name, email };

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

  // Create default categories for the new user
  const { data: newUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (newUser) {
    const defaultCategories = [
      { user_id: newUser.id, name: "Casa", color: "#3B82F6", icon: "🏠" },
      { user_id: newUser.id, name: "Comida", color: "#F59E0B", icon: "🍔" },
      { user_id: newUser.id, name: "Transporte", color: "#EF4444", icon: "🚗" },
      { user_id: newUser.id, name: "Servicios", color: "#8B5CF6", icon: "⚡" },
      { user_id: newUser.id, name: "Salud", color: "#10B981", icon: "💊" },
      { user_id: newUser.id, name: "Entretenimiento", color: "#EC4899", icon: "🎮" },
      { user_id: newUser.id, name: "Ropa", color: "#14B8A6", icon: "👕" },
      { user_id: newUser.id, name: "Educacion", color: "#06B6D4", icon: "📚" },
    ];
    await supabaseAdmin.from("categories").insert(defaultCategories);
  }

  return NextResponse.json({ message: "Cuenta creada exitosamente" });
}
