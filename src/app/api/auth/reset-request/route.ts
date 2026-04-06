import { supabaseAdmin } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";
import { resetCodes } from "@/lib/reset-codes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "El email es requerido" },
      { status: 400 }
    );
  }

  // Always return success to not reveal if email exists
  const successResponse = NextResponse.json({
    message: "Si el email esta registrado, recibiras un codigo",
  });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .eq("email", email)
    .single();

  if (!user) {
    return successResponse;
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

  resetCodes.set(email.toLowerCase(), { code, expires });

  await sendEmail({
    to: email,
    subject: "Codigo de recuperacion - MiFinanzas",
    html: `<h2>Hola ${user.display_name}!</h2><p>Tu codigo de recuperacion es:</p><h1 style="font-size:36px;letter-spacing:8px;text-align:center;color:#059669;">${code}</h1><p>Este codigo expira en 15 minutos.</p><p>Si no solicitaste este cambio, ignora este email.</p><p>— MiFinanzas</p>`,
  });

  return successResponse;
}
