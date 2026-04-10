import { supabaseAdmin } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ available: false });

  const { data } = await supabaseAdmin.from("users").select("id").eq("username", username).single();
  return NextResponse.json({ available: !data });
}
