import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { verifyTokens } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: "DATABASE_URL configured nahi hai." }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const token = `vt_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(verifyTokens).values({ token, expiresAt });
    const origin = req.headers.get("origin") || req.headers.get("host") || "";
    const base = origin.startsWith("http") ? origin : `https://${origin}`;
    const link = `${base}/verify?token=${token}`;
    return NextResponse.json({ success: true, link, token });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
