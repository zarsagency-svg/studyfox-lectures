"use client";

const ENROLLED_KEY = "learntopper_enrolled";
const HISTORY_KEY = "learntopper_history";
const DONE_KEY = "learntopper_done";
const ACTIVE_BATCH_KEY = "learntopper_activeBatch";

export function getEnrolled(): any[] {
  try {
    return JSON.parse(localStorage.getItem(ENROLLED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setEnrolled(list: any[]) {
  try {
    localStorage.setItem(ENROLLED_KEY, JSON.stringify(list));
  } catch {}
}

export function isEnrolled(batch: any): boolean {
  if (!batch) return false;
  const id = batch._id || batch.id;
  return getEnrolled().some((b: any) => (b._id || b.id) === id);
}

export function enrollBatch(batch: any) {
  const list = getEnrolled();
  if (!isEnrolled(batch)) {
    list.push(batch);
    setEnrolled(list);
  }
}

export function unenrollBatch(batchId: string) {
  const list = getEnrolled().filter((b: any) => (b._id || b.id) !== batchId);
  setEnrolled(list);
}

export type HistoryItem = {
  subjectId: string;
  tag: string;
  kind: string;
  contentId: string;
  title?: string;
  openedAt: string;
};

export function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushHistory(item: Omit<HistoryItem, "openedAt">) {
  try {
    const list = getHistory().filter((h) => h.contentId !== item.contentId);
    list.unshift({ ...item, openedAt: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {}
}

export function getDoneSet(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function toggleDone(contentId: string): Set<string> {
  const set = getDoneSet();
  if (set.has(contentId)) set.delete(contentId);
  else set.add(contentId);
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...set]));
  } catch {}
  return set;
}

export function getActiveBatch(): string {
  try {
    return localStorage.getItem(ACTIVE_BATCH_KEY) || "";
  } catch {
    return "";
  }
}

export function setActiveBatch(id: string) {
  try {
    localStorage.setItem(ACTIVE_BATCH_KEY, id);
  } catch {}
}

export function toast(msg: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app-toast", { detail: msg }));
  }
}
