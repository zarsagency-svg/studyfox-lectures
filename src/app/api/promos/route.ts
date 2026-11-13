import { NextResponse } from "next/server";
import { UPSTREAM } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${UPSTREAM}/api/promos`, { cache: "no-store" });
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({
      success: true,
      items: [
        { img: "/banners/banner1.jpg", link: "https://t.me/studyyfox" },
        { img: "/banners/banner2.jpg", link: "https://t.me/studyyfox" },
        { img: "/banners/banner3-study.jpg", link: "https://t.me/studyyfox" },
      ],
    });
  }
}
