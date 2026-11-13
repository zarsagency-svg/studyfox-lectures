import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const phone = new URL(req.url).searchParams.get("phone") || "";
  if (!phone) return NextResponse.json({ success: true, data: [] });
  try {
    const rows = await db.select().from(enrollments).where(eq(enrollments.phone, phone));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { phone, batchId, batchName, batchData } = await req.json();
    if (!phone || !batchId) return NextResponse.json({ success: false }, { status: 400 });
    const existing = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.batchId, String(batchId)))
      .limit(1);
    if (!existing[0]) {
      await db.insert(enrollments).values({ phone: String(phone), batchId: String(batchId), batchName, batchData });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { phone, batchId } = await req.json();
    if (!phone || !batchId) return NextResponse.json({ success: false }, { status: 400 });
    await db.delete(enrollments).where(eq(enrollments.batchId, String(batchId)));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
