import { NextResponse } from "next/server";
import { db } from "@/db";
import { history } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  if (!phone) return NextResponse.json({ success: true, data: [] });
  try {
    const rows = await db.select().from(history).where(eq(history.phone, phone)).orderBy(desc(history.id)).limit(40);
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { phone, subjectId, tag, kind, contentId, title } = await req.json();
    if (!phone || !contentId) return NextResponse.json({ success: false }, { status: 400 });
    await db.insert(history).values({
      phone: String(phone),
      subjectId: String(subjectId || ""),
      tag: String(tag || ""),
      kind: String(kind || ""),
      contentId: String(contentId),
      title: String(title || ""),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
