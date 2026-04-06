import { supabaseAdmin } from "@/lib/supabase-server";
import { createToken } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// In-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Check rate limit
  const attempts = loginAttempts.get(ip);
  if (attempts) {
    const elapsed = Date.now() - attempts.lastAttempt;
    if (elapsed > WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (attempts.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Demasiados intentos, espera 15 minutos" },
        { status: 429 }
      );
    }
  }

  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contrasena requeridos" }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, username, display_name, email, password")
    .eq("username", username)
    .single();

  if (error || !user) {
    // Track failed attempt
    const current = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    loginAttempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });
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
    // Track failed attempt
    const current = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    loginAttempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });
    return NextResponse.json({ error: "Usuario o contrasena incorrectos" }, { status: 401 });
  }

  // Reset on successful login
  loginAttempts.delete(ip);

  const token = createToken(user.id);

  return NextResponse.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email || undefined,
    token,
  });
}
