"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBatchDetails, teacherImage } from "@/lib/api";

export default function BatchDetailPage() {
  const { id } = useParams() as { id: string };
  const [batch, setBatch] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    getBatchDetails(id)
      .then((e) => {
        if (e?.success && e.data) setBatch(e.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!batch && !failed) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        <div className="glass-card !rounded-2xl p-4 sm:p-6">
          <div className="shimmer h-40 rounded-[28px]" />
          <div className="shimmer h-20 rounded-[24px] mt-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-20 rounded-[24px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (failed || !batch) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        <div className="glass-card !rounded-2xl p-4 sm:p-6 text-center py-10">
          <p className="text-lg font-bold text-[#0f172a] dark:text-gray-100">Data load nahi hua</p>
          <p className="text-sm text-muted-foreground mt-1">Network thoda busy tha, ek baar retry karke dekho.</p>
          <button
            onClick={load}
            className="mt-4 h-10 px-6 rounded-full text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      <div className="glass-card !rounded-2xl p-4 sm:p-6">
        <div className="bg-gradient-to-br from-[#8b7bf7] to-[#6d5df0] rounded-[28px] min-h-[10rem] flex items-center px-6 sm:px-10 py-8 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{batch.name || batch.batchName}</h1>
        </div>

        <Link
          href={`/study/batch/${id}/tests`}
          className="group block rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)] mt-8 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[3px] active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6" />
                <path d="M9 16h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-gray-100">Tests</div>
              <div className="text-sm text-muted-foreground">AITS, practice tests aur result</div>
            </div>
            <div className="ml-auto w-9 h-9 rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </Link>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0f172a] dark:text-gray-100">Subjects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(batch.subjects || []).map((s: any) => {
            const img = teacherImage(s);
            return (
              <Link
                key={s._id}
                href={`/study/batch/${id}/${s._id}`}
                className="group block rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[3px] active:scale-[0.96] active:shadow-[0_3px_8px_-4px_rgba(6,43,95,0.3)] animate-fadeIn"
              >
                <div className="flex items-center gap-4 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
                  {img ? (
                    <img src={img} alt="" className="w-12 h-12 object-contain flex-shrink-0 rounded-xl" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-spring-leaf/10 flex items-center justify-center text-2xl flex-shrink-0">📘</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-gray-100 truncate">{s.subject}</div>
                    <div className="text-sm text-muted-foreground">{s.tagCount || 0} Chapters</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
