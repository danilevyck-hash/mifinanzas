import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const category = request.nextUrl.searchParams.get("category");
  if (!category) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin
    .from("personal_expenses")
    .select("notes")
    .eq("user_id", userId)
    .eq("category", category)
    .not("notes", "is", null)
    .neq("notes", "")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get distinct notes, preserving order by most recent
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const row of data || []) {
    const note = row.notes as string;
    if (!seen.has(note)) {
      seen.add(note);
      unique.push(note);
      if (unique.length >= 5) break;
    }
  }

  return NextResponse.json(unique);
}
