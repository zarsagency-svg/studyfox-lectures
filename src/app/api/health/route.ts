import { db } from "@/db";
import { isDbConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isDbConfigured()) {
    return Response.json({ ok: true, app: true, db: false, reason: "DATABASE_URL not set" });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, app: true, db: true });
  } catch (e: any) {
    return Response.json({ ok: true, app: true, db: false, reason: String(e?.message || e) }, { status: 200 });
  }
}
