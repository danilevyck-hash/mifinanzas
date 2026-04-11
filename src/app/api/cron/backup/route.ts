import { supabaseAdmin } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "personal_expenses",
  "categories",
  "category_budgets",
  "recurring_expenses",
  "users",
] as const;

const BUCKET = "backups";
const RETENTION_DAYS = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Export all tables
    const backup: Record<string, unknown[]> = {};

    for (const table of TABLES) {
      const { data, error } = await supabaseAdmin.from(table).select("*");
      if (error) {
        console.error(`Error exporting ${table}:`, error.message);
        backup[table] = [];
      } else {
        backup[table] = data || [];
      }
    }

    // Upload to Supabase Storage
    const today = new Date().toISOString().split("T")[0];
    const fileName = `backup-${today}.json`;
    const fileContent = JSON.stringify(backup, null, 2);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, fileContent, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Clean up backups older than 30 days
    const { data: files } = await supabaseAdmin.storage.from(BUCKET).list();
    if (files) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

      const oldFiles = files.filter((f) => {
        const match = f.name.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
        if (!match) return false;
        return new Date(match[1]) < cutoff;
      });

      if (oldFiles.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(oldFiles.map((f) => f.name));
      }
    }

    const totalRows = Object.values(backup).reduce((sum, arr) => sum + arr.length, 0);

    return NextResponse.json({
      success: true,
      fileName,
      tables: TABLES.length,
      totalRows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
