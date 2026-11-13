import { NextResponse } from "next/server";
import { db } from "@/db";
import { verifyTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = req.headers.get("x-verify-token") || new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ ok: false });
  try {
    const rows = await db.select().from(verifyTokens).where(eq(verifyTokens.token, token)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ ok: false });
    if (new Date(row.expiresAt) < new Date()) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
