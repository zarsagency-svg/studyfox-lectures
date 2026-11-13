import { NextResponse } from "next/server";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  if (!phone) return NextResponse.json({ success: true, data: [] });
  try {
    const rows = await db.select().from(progress).where(eq(progress.phone, phone));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { phone, contentId, done } = await req.json();
    if (!phone || !contentId) return NextResponse.json({ success: false }, { status: 400 });
    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.phone, String(phone)), eq(progress.contentId, String(contentId))))
      .limit(1);
    if (existing[0]) {
      await db.update(progress).set({ done: !!done }).where(eq(progress.id, existing[0].id));
    } else {
      await db.insert(progress).values({ phone: String(phone), contentId: String(contentId), done: !!done });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
