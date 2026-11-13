import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { otps, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { success: false, message: "Demo mode: database configured nahi hai, OTP login abhi available nahi." },
      { status: 503 }
    );
  }
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: "Phone aur OTP dono zaroori hai" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(otps)
      .where(and(eq(otps.phone, String(phone)), eq(otps.used, false)))
      .orderBy(desc(otps.id))
      .limit(1);
    const row = rows[0];
    if (!row || row.otp !== String(otp) || new Date(row.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, message: "Galat OTP ya OTP expire ho gaya" }, { status: 400 });
    }
    await db.update(otps).set({ used: true }).where(eq(otps.id, row.id));

    const accessToken = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const existing = await db.select().from(users).where(eq(users.phone, String(phone))).limit(1);
    let user: any;
    if (existing[0]) {
      await db.update(users).set({ accessToken, updatedAt: new Date() }).where(eq(users.id, existing[0].id));
      user = { ...existing[0], accessToken };
    } else {
      const inserted = await db
        .insert(users)
        .values({ phone: String(phone), name: `Student ${String(phone).slice(-4)}`, accessToken })
        .returning();
      user = inserted[0];
    }
    return NextResponse.json({
      success: true,
      user: { phone: user.phone, name: user.name, accessToken: user.accessToken, membership: "Active Member" },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
