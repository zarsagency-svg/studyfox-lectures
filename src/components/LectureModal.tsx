"use client";

import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { pdfUrl } from "@/lib/api";
import { resolvePlayback, type PlaybackSource } from "@/lib/playback";
import { Download, Printer, ExternalLink, X, FileText, Play } from "lucide-react";

export type LectureDetail = any;

export default function LectureModal({
  detail,
  loading,
  onClose,
  batchId,
  subjectId,
  scheduleId,
}: {
  detail: LectureDetail | null;
  loading: boolean;
  onClose: () => void;
  batchId: string;
  subjectId: string;
  scheduleId: string;
}) {
  const [pdfOpen, setPdfOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"video" | "notes">("video");
  const [play, setPlay] = useState<PlaybackSource | null>(null);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    if (detail) {
      setPdfOpen(null);
      setTab(detail?.videoDetails?.videoUrl || detail?.url ? "video" : "notes");
    }
  }, [detail]);

  // The raw videoUrl from /api/lecture-details is an unsigned CloudFront link
  // (always 403 MissingKey). Mint a signed URL + ClearKey from the video API.
  useEffect(() => {
    const rawUrl = detail?.videoDetails?.videoUrl || detail?.url || "";
    if (!detail || (!rawUrl && !detail?.videoDetails)) {
      setPlay(null);
      setPlayError("");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setPlay(null);
    setPlayError("");
    setPlayLoading(true);

    resolvePlayback({
      batchId,
      subjectId,
      scheduleId,
      fallbackUrl: rawUrl,
      signal: controller.signal,
    })
      .then((src) => {
        if (!cancelled) setPlay(src);
      })
      .catch((e: any) => {
        if (cancelled || e?.name === "AbortError") return;
        setPlayError(e?.message || "Video load nahi ho paya.");
      })
      .finally(() => {
        if (!cancelled) setPlayLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [detail, batchId, subjectId, scheduleId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!detail && !loading) return null;

  const poster = detail?.videoDetails?.image || "";
  const title = detail?.topic || detail?.videoDetails?.name || "Lecture";
  const subjectName = detail?.subject?.name || "";
  const homework: any[] = detail?.homeworkIds || [];
  const dateStr = detail?.date
    ? new Date(detail.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const duration = detail?.videoDetails?.duration || "";

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase">{subjectName || "Lecture"}</p>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug mt-1">{title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {dateStr}
              {duration ? ` • ${duration}` : ""}
              {detail?.lectureType ? ` • ${detail.lectureType}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="shimmer aspect-video rounded-2xl" />
              <div className="shimmer h-4 rounded w-2/3" />
              <div className="shimmer h-4 rounded w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setTab("video")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tab === "video"
                      ? "text-white bg-gradient-to-r from-blue-500 to-sky-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Play size={14} /> Video
                </button>
                <button
                  onClick={() => setTab("notes")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tab === "notes"
                      ? "text-white bg-gradient-to-r from-blue-500 to-sky-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <FileText size={14} /> Notes ({homework.length})
                </button>
              </div>

              {tab === "video" && (
                <div>
                  {playLoading ? (
                    <div className="aspect-video rounded-2xl shimmer flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
                      <div className="w-10 h-10 rounded-full border-4 border-white/40 border-t-blue-500 animate-spin" />
                      <p>Video load ho raha hai…</p>
                    </div>
                  ) : play ? (
                    <VideoPlayer source={play} poster={poster} title={title} />
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-sm gap-2 px-6 text-center">
                      <Play size={32} />
                      <p>{playError || "Video abhi ready nahi hai"}</p>
                    </div>
                  )}
                  {detail?.topicData && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      {detail.topicData}
                    </div>
                  )}
                </div>
              )}

              {tab === "notes" && (
                <div className="space-y-3">
                  {homework.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Is lecture ke liye koi note nahi hai.</p>
                  ) : (
                    homework.map((hw: any, idx: number) => {
                      const atts: any[] = hw.attachmentIds || [];
                      return (
                        <div key={hw._id || idx} className="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50">
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{hw.topic || hw.note || `Note ${idx + 1}`}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{hw.note || "Class Notes"}</p>
                          <div className="mt-3 space-y-2">
                            {atts.map((a: any) => {
                              const url = pdfUrl(a);
                              const isOpen = pdfOpen === a._id;
                              return (
                                <div key={a._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                  <div className="flex items-center gap-2 p-3">
                                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                    <span className="text-xs font-semibold truncate flex-1">{a.name || "PDF"}</span>
                                    <button
                                      onClick={() => setPdfOpen(isOpen ? null : a._id)}
                                      className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white active:scale-95"
                                    >
                                      {isOpen ? "Close" : "Open"}
                                    </button>
                                    <a
                                      href={url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Download"
                                    >
                                      <Download size={16} />
                                    </a>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Print / Open in new tab"
                                    >
                                      <Printer size={16} />
                                    </a>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Open">
                                      <ExternalLink size={16} />
                                    </a>
                                  </div>
                                  {isOpen && url && (
                                    <div className="border-t border-slate-100 dark:border-slate-700">
                                      <iframe src={url} title={a.name} className="w-full h-[420px] bg-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
