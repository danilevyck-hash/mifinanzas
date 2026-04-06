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

  // Send welcome email
  await sendEmail({
    to: email,
    subject: "Bienvenido a MiFinanzas",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F172A; color: white; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">MiFinanzas</h1>
          <p style="margin: 8px 0 0; color: #818CF8; font-size: 14px;">Control de gastos personales</p>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #E2E8F0; border-top: none;">
          <h2 style="color: #0F172A; margin: 0 0 12px;">Hola ${display_name}!</h2>
          <p style="color: #64748B; line-height: 1.6;">Tu cuenta ha sido creada exitosamente. Ya puedes empezar a registrar tus gastos y tomar control de tus finanzas.</p>
          <div style="background: white; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #E2E8F0;">
            <p style="margin: 0; color: #94A3B8; font-size: 12px;">TU USUARIO</p>
            <p style="margin: 4px 0 0; color: #0F172A; font-weight: 600; font-size: 18px;">@${username}</p>
          </div>
          <p style="color: #64748B; font-size: 14px;">Te creamos 8 categorias para que empieces rapido. Puedes editarlas en Configuracion.</p>
          <a href="https://mifinanzas.vercel.app/login" style="display: block; background: #6366F1; color: white; text-align: center; padding: 12px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px;">Iniciar sesion</a>
        </div>
        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">MiFinanzas — Hecho en Panama</p>
      </div>
    `,
  });

  return NextResponse.json({ message: "Cuenta creada exitosamente" });
}
