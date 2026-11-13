"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBatchDetails, getTopics } from "@/lib/api";
import { getHistory } from "@/lib/storage";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4 shadow-sm">
          <div className="shimmer rounded-full w-14 h-8 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-4 rounded-md w-2/3" />
            <div className="shimmer h-3 rounded-md w-1/3" />
          </div>
          <div className="shimmer rounded-full w-9 h-9" />
        </div>
      ))}
    </div>
  );
}

export default function SubjectPage() {
  const { id, subjectId } = useParams() as { id: string; subjectId: string };
  const [topics, setTopics] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subjectName, setSubjectName] = useState<string | null>(null);

  useEffect(() => {
    getBatchDetails(id)
      .then((e) => {
        const data = (e as any)?.data || e;
        const found = ((data as any)?.subjects || []).find((s: any) => s._id === subjectId);
        if (found) setSubjectName(found.subject);
      })
      .catch(() => {});
  }, [id, subjectId]);

  const load = useCallback(
    async (p: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await getTopics(id, subjectId, p);
        const rows = (res as any)?.data || [];
        setTopics((prev) => (append ? [...prev, ...rows.filter((r: any) => !prev.some((e: any) => e._id === r._id))] : rows));
        setPage(p);
        setHasMore(rows.length >= 20);
        if (!append && rows.length >= 20) {
          const res2 = await getTopics(id, subjectId, 2);
          const rows2 = (res2 as any)?.data || [];
          if (rows2.length) {
            setTopics((prev) => [...prev, ...rows2.filter((r: any) => !prev.some((e: any) => e._id === r._id))]);
            setPage(2);
            setHasMore(rows2.length >= 20);
          }
        }
      } catch {}
      setLoading(false);
      setLoadingMore(false);
    },
    [id, subjectId]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const history = getHistory();

  return (
    <div className="pb-24 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="px-4 pt-5">
        <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">Subject View</p>
        <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{subjectName || "Subject"}</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5">Access chapter lectures, DPP PDFs, study material and resources</p>
      </div>

      <div className="px-4 mt-6">
        {loading ? (
          <Skeleton />
        ) : topics.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Is subject mein abhi kuch nahi hai.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {topics.map((t: any, idx: number) => {
                const total = (t.lectureVideos || 0) + (t.videos || 0);
                const opened = history.filter((h) => h.subjectId === subjectId && h.tag === t._id && h.kind === "lecture").length;
                const dppTotal = t.exercises || 0;
                const dppOpened = history.filter((h) => h.subjectId === subjectId && h.tag === t._id && h.kind === "dpp").length;
                return (
                  <Link
                    key={t._id}
                    href={`/study/batch/${id}/${subjectId}/${t._id}?name=${encodeURIComponent(t.name || "")}&sub=${encodeURIComponent(subjectName || "")}`}
                    className="group block rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)] transition-all duration-150 active:translate-y-[3px] active:scale-[0.96] active:shadow-[0_3px_8px_-4px_rgba(6,43,95,0.3)]"
                  >
                    <span className="flex items-center gap-4 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
                      <span className="shrink-0 rounded-2xl px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_3px_0_0_rgba(79,70,229,0.45)] group-active:shadow-[0_1px_0_0_rgba(79,70,229,0.45)] transition-all">
                        CH - {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 min-w-0 block">
                        <span className="block font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-snug truncate">{t.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Lecture: {opened}/{total}
                          {dppTotal > 0 ? ` • DPP: ${dppOpened}/${dppTotal}` : null}
                        </span>
                      </span>
                      <span className="shrink-0 w-9 h-9 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-white/80 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            {hasMore && (
              <button
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="w-full mt-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-blue-200 dark:border-blue-500/30 text-sm font-bold text-blue-700 dark:text-blue-400 shadow-sm"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
