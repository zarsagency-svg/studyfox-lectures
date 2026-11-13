"use client";

import { authHeaders, getAuth, setAuth } from "./auth";

async function pwFetch(path: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    const res = await fetch(`/api/pw${path}`, {
      headers: { ...authHeaders() },
      cache: "no-store",
      signal: controller.signal,
    });
    const token = res.headers.get("x-sp-token");
    if (token) {
      const user = getAuth();
      if (user) setAuth({ ...user, accessToken: token });
    }
    if (!res.ok) throw new Error(`request failed (${res.status})`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve a *playable* video URL.
 *
 * The `videoDetails.videoUrl` returned by /api/lecture-details is a raw,
 * UNSIGNED CloudFront link and always answers 403 "MissingKey" when played
 * directly. The real URL has to be minted per request from the PW video
 * endpoint (`/api/video` -> proxied to `<UPSTREAM>/api/pw/api/video`), which
 * returns a signed manifest URL (Signature / Policy / Key-Pair-Id) plus the
 * ClearKey `clearKeys` needed to decrypt the CENC-encrypted DASH stream.
 */
export type SignedVideo = {
  url: string;
  clearKeys: Record<string, string>;
  topic: string;
};

export async function getSignedVideo(
  batchId: string,
  subjectId: string,
  scheduleId: string,
  opts: { live?: boolean; signal?: AbortSignal } = {}
): Promise<SignedVideo> {
  const query =
    `batchId=${encodeURIComponent(batchId)}` +
    `&scheduleId=${encodeURIComponent(scheduleId)}` +
    `&subjectId=${encodeURIComponent(subjectId)}` +
    (opts.live ? "&live=1" : "");

  // Signing can be slow upstream (uncached), so allow more time than usual.
  const data = await pwFetch(`/api/video?${query}`, { signal: opts.signal, timeoutMs: 60000 });
  const payload = data?.data && typeof data.data === "object" ? { ...data, ...data.data } : data;

  const url: string = payload?.video_url || payload?.videoUrl || "";
  if (!url) throw new Error(payload?.message || "Is lecture ka video abhi available nahi hai.");

  const clearKeys =
    payload?.clearKeys && typeof payload.clearKeys === "object" ? (payload.clearKeys as Record<string, string>) : {};

  return { url, clearKeys, topic: payload?.topic || "" };
}

function normalizeBatch(e: any) {
  return {
    ...e,
    _id: e._id || e.batchId,
    name: e.batchName || e.name || "",
    previewImage: e.batchImage || e.previewImage || "",
    feeTotal: e.batchPrice ?? e.feeTotal ?? 0,
  };
}

function normalizeBatchesResponse(e: any) {
  return {
    success: e?.success !== false,
    batches: (Array.isArray(e?.data) ? e.data : e?.batches || []).map(normalizeBatch),
    currentPage: e?.currentPage || 1,
    totalPages: e?.totalPages || 1,
    totalItems: e?.totalItems || 0,
  };
}

export async function fetchBatches(page = 1, opts: { signal?: AbortSignal } = {}) {
  const data = await pwFetch(`/api/batches?page=${page}`, opts);
  return normalizeBatchesResponse(data);
}

export async function searchBatches(name: string, page = 1, opts: { signal?: AbortSignal } = {}) {
  const data = await pwFetch(`/api/search?name=${encodeURIComponent(name)}&page=${page}`, opts);
  return normalizeBatchesResponse(data);
}

export async function getBatchDetails(batchId: string) {
  return pwFetch(`/api/batch-details?batchId=${encodeURIComponent(batchId)}`);
}

export async function getMyBatches() {
  return pwFetch(`/api/mybatches`);
}

export async function getTopics(batchId: string, subjectId: string, page = 1) {
  return pwFetch(
    `/api/topics?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&page=${page}`
  );
}

export async function getTodaysSchedule(batchId: string) {
  return pwFetch(`/api/todays-schedule?batchId=${encodeURIComponent(batchId)}`);
}

export async function getLectureDetails(batchId: string, subjectId: string, scheduleId: string) {
  return pwFetch(
    `/api/lecture-details?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&scheduleId=${encodeURIComponent(scheduleId)}`
  );
}

export async function getContents(
  batchId: string,
  subjectId: string,
  contentType: string,
  tag: string,
  page = 1
) {
  return pwFetch(
    `/api/contents?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&contentType=${encodeURIComponent(contentType)}&tag=${encodeURIComponent(tag)}&page=${page}`
  );
}

export async function getAnnouncements(batchId: string, page = 1) {
  return pwFetch(`/api/announcements?batchId=${encodeURIComponent(batchId)}&page=${page}`);
}

// Test series (via /api/pw/ts proxy)
async function tsFetch(path: string) {
  const res = await fetch(`/api/pw/ts${path}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`request failed (${res.status})`);
  const json = await res.json();
  return json && json.data !== undefined ? json.data : json;
}

export async function getTestFilters(batchId: string, isSubjective = false) {
  return tsFetch(`/tests/filters?batchId=${encodeURIComponent(batchId)}&isSubjective=${!!isSubjective}`);
}

export async function getTests(categorySectionId: string, batchId: string, isSubjective = false) {
  return tsFetch(
    `/tests?categorySectionId=${encodeURIComponent(categorySectionId)}&batchId=${encodeURIComponent(batchId)}&isSubjective=${!!isSubjective}`
  );
}

export async function getTestInstructions(testId: string) {
  return tsFetch(`/tests/${encodeURIComponent(testId)}/instructions`);
}

export async function getTestDetail(testId: string, testName: string, batchId: string) {
  const res = await fetch(
    `/api/pw/test?testId=${encodeURIComponent(testId)}&testName=${encodeURIComponent(testName || "")}&batchId=${encodeURIComponent(batchId)}`,
    { headers: { ...authHeaders() }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`request failed (${res.status})`);
  return res.json();
}

// DPP quiz
export async function getDppQuizzes(batchId: string, subjectId: string, tag: string, page = 1) {
  return pwFetch(
    `/api/dpp-quiz?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&tag=${encodeURIComponent(tag)}&page=${page}`
  ).catch(async () => {
    // fallback: try /api/dpp
    return pwFetch(
      `/api/dpp?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&tag=${encodeURIComponent(tag)}&page=${page}`
    );
  });
}

export function pdfUrl(attachment: any): string {
  if (!attachment) return "";
  const base = attachment.baseUrl || "https://static.pw.live/";
  const key = attachment.key || "";
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${base}${key}`;
}

export function teacherImage(subject: any): string {
  const t = (subject?.teacherIds || [])[0];
  if (t?.imageId) {
    const base = t.imageId.baseUrl || "https://static.pw.live/";
    const key = t.imageId.key || "";
    if (key) return key.startsWith("http") ? key : `${base}${key}`;
  }
  if (subject?.imageId) {
    const base = subject.imageId.baseUrl || "https://static.pw.live/";
    const key = subject.imageId.key || "";
    if (key) return key.startsWith("http") ? key : `${base}${key}`;
  }
  return "";
}
