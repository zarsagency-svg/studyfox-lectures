import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Manifest re-writer.
 *
 * PW hands out signed CloudFront URLs for a *directory* prefix, e.g.
 *
 *   https://<cdn>/<video-id>/master.mpd?Signature=..&Policy=..&Key-Pair-Id=..
 *
 * The signature is valid for every object under `<video-id>/`, but DASH/HLS
 * players resolve `dash/audio/$Number$.mp4` against the manifest URL and drop
 * the query string -> every segment request comes back 403 (MissingKey).
 *
 * This route fetches the manifest and turns all relative URIs into absolute
 * ones WITH the signed query string appended, then serves it same-origin.
 * Segments themselves are streamed straight from the CDN by the player
 * (the CDN replies with `Access-Control-Allow-Origin: <origin>` and supports
 * Range requests), so we never proxy video bytes.
 */

const ALLOWED_HOST_SUFFIXES = [
  "cloudfront.net",
  "studypika.eu.cc",
  "pw.live",
  "penpencil.co",
  "mscilearn.in",
  "amazonaws.com",
];

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function withSignature(ref: string, base: URL): string {
  if (!ref || ref.startsWith("data:") || ref.startsWith("blob:")) return ref;
  let url: URL;
  try {
    url = new URL(ref, base);
  } catch {
    return ref;
  }
  // Keep the signature/policy parameters of the manifest on every child object.
  if (base.search && !url.search) url.search = base.search;
  return url.toString();
}

function rewriteDash(xml: string, base: URL): string {
  let out = xml.replace(
    /(\s(?:media|initialization|sourceURL|index|xlink:href|href))="([^"]*)"/gi,
    (_match, attr: string, ref: string) => `${attr}="${withSignature(ref, base)}"`
  );
  out = out.replace(/(<BaseURL[^>]*>)([^<]+)(<\/BaseURL>)/gi, (_m, open, ref, close) => {
    return `${open}${withSignature(String(ref).trim(), base)}${close}`;
  });
  return out;
}

function rewriteHls(playlist: string, base: URL): string {
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        // EXT-X-KEY / EXT-X-MAP / EXT-X-MEDIA ... all carry URI="..."
        return line.replace(/URI="([^"]+)"/g, (_m, ref: string) => `URI="${withSignature(ref, base)}"`);
      }
      return withSignature(trimmed, base);
    })
    .join("\n");
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) return jsonError("Missing src parameter", 400);

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return jsonError("Invalid src URL", 400);
  }
  if (!/^https?:$/.test(target.protocol) || !isAllowedHost(target.hostname)) {
    return jsonError("Host is not allowed", 403);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch (e: any) {
    return jsonError(`Manifest fetch failed: ${e?.message || e}`, 502);
  }

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => "");
    return new NextResponse(body.slice(0, 500) || `Upstream ${upstream.status}`, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const text = await upstream.text();
  const isDash = /\.mpd(\?|#|$)/i.test(target.pathname + target.search) || text.includes("<MPD");
  const body = isDash ? rewriteDash(text, target) : rewriteHls(text, target);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": isDash ? "application/dash+xml; charset=utf-8" : "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
