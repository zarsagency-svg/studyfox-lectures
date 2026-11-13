import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { otps } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { success: false, message: "Demo mode: database configured nahi hai, is liye OTP login abhi available nahi. Aap Guest ke roop mein lectures dekh sakte ho." },
      { status: 503 }
    );
  }
  try {
    const { phone } = await req.json();
    if (!phone || String(phone).length < 10) {
      return NextResponse.json({ success: false, message: "Valid phone number daalo" }, { status: 400 });
    }
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.insert(otps).values({ phone: String(phone), otp, expiresAt });
    // Demo mode: return OTP so user can login in preview (in production this would be sent via SMS/WhatsApp)
    return NextResponse.json({ success: true, message: "OTP bheja gaya hai", otp });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
