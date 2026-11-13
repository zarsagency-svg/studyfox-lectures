import { NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let loginRequired = false;
  let verifyRequired = false;
  try {
    const rows = await db.select().from(appSettings);
    for (const r of rows) {
      if (r.key === "loginRequired") loginRequired = r.value === "true";
      if (r.key === "verifyRequired") verifyRequired = r.value === "true";
    }
  } catch {}
  return NextResponse.json({ loginRequired, verifyRequired });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.key && body.value !== undefined) {
      await db
        .insert(appSettings)
        .values({ key: String(body.key), value: String(body.value) })
        .onConflictDoUpdate({ target: appSettings.key, set: { value: String(body.value) } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
