"use client";

import { getSignedVideo } from "./api";

export type PlaybackKind = "dash" | "hls" | "file";

export type PlaybackSource = {
  /** URL to hand to the player (already routed through /api/stream for manifests). */
  url: string;
  kind: PlaybackKind;
  /** ClearKey map in the `kidHex: keyHex` form returned by the PW video API. */
  clearKeys: Record<string, string>;
  /** true when we resolved a signed URL from the PW video endpoint. */
  signed: boolean;
};

const DASH_RE = /\.mpd(\?|#|$)/i;
const HLS_RE = /\.m3u8(\?|#|$)/i;

export function kindOf(url: string): PlaybackKind {
  if (DASH_RE.test(url)) return "dash";
  if (HLS_RE.test(url)) return "hls";
  return "file";
}

/**
 * Manifest routes are served through our own proxy so the signed CloudFront
 * query string can be copied onto every relative segment URL (dash.js/hls.js
 * drop the query string when they resolve `media="dash/audio/$Number$.mp4"`).
 */
export function streamUrl(signedUrl: string) {
  return `/api/stream?src=${encodeURIComponent(signedUrl)}`;
}

function hexToBase64Url(hex: string): string {
  const clean = String(hex || "").replace(/[^0-9a-fA-F]/g, "");
  if (!clean || clean.length % 2 !== 0) return "";
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * dash.js (v5) looks ClearKey up by the base64url key-id that the CDM puts in
 * its licence request, and expects base64url values in the JWK it builds.
 * PW gives us plain hex, so convert it here.
 */
export function toDashClearKeys(clearKeys: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(clearKeys || {}).forEach(([kidHex, keyHex]) => {
    const kid = hexToBase64Url(kidHex);
    const key = hexToBase64Url(keyHex);
    if (kid && key) out[kid] = key;
  });
  return out;
}

/**
 * Work out what the player should load for a lecture.
 *
 * 1. Ask the PW video endpoint for a signed manifest + clear keys.
 * 2. Fall back to the URL from /api/lecture-details only when that URL is
 *    actually usable on its own (i.e. not an unsigned CloudFront DASH/HLS url).
 */
export async function resolvePlayback(args: {
  batchId: string;
  subjectId: string;
  scheduleId: string;
  fallbackUrl?: string;
  signal?: AbortSignal;
}): Promise<PlaybackSource> {
  const { batchId, subjectId, scheduleId, fallbackUrl = "", signal } = args;
  let signedError: unknown = null;

  try {
    const signed = await getSignedVideo(batchId, subjectId, scheduleId, { signal });
    if (signed.url) {
      const kind = kindOf(signed.url);
      return {
        url: kind === "file" ? signed.url : streamUrl(signed.url),
        kind,
        clearKeys: signed.clearKeys,
        signed: true,
      };
    }
  } catch (e) {
    signedError = e;
  }

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // A bare .mpd/.m3u8 from lecture-details is unsigned -> guaranteed 403.
  if (fallbackUrl && kindOf(fallbackUrl) === "file") {
    return { url: fallbackUrl, kind: "file", clearKeys: {}, signed: false };
  }

  throw signedError instanceof Error
    ? signedError
    : new Error("Is lecture ka video abhi available nahi hai.");
}
