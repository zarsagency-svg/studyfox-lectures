import { NextRequest, NextResponse } from "next/server";
import { UPSTREAM } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function proxy(req: NextRequest, path: string[]) {
  const upstreamPath = path.join("/");
  const search = req.nextUrl.search || "";
  const url = `${UPSTREAM}/api/pw/${upstreamPath}${search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);
  headers.set("User-Agent", "Mozilla/5.0");
  headers.set("Accept", "application/json");

  const method = req.method;
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.text();
      if (body) headers.set("Content-Type", "application/json");
    } catch {}
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      cache: "no-store",
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { success: false, message: text.slice(0, 500) };
    }
    const out = NextResponse.json(json, { status: res.status });
    const token = res.headers.get("x-sp-token");
    if (token) out.headers.set("x-sp-token", token);
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
