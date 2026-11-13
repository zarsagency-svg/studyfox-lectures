"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getTestInstructions, getTestDetail } from "@/lib/api";
import VerifyGate from "@/components/VerifyGate";

export default function TestDetailPage() {
  const { id, testId } = useParams() as { id: string; testId: string };
  const sp = useSearchParams();
  const name = sp.get("name") || "Test";
  const dur = sp.get("dur") || "0";
  const marks = sp.get("marks") || "0";
  const total = sp.get("total") || "0";
  const tag = sp.get("tag") || "Start";
  const [instructions, setInstructions] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ins = await getTestInstructions(testId).catch(() => null);
        setInstructions(ins);
      } catch {}
      try {
        const d = await getTestDetail(testId, name, id).catch(() => null);
        setDetail(d);
      } catch {}
      setLoading(false);
    })();
  }, [testId, name, id]);

  const rows = [
    ["Test Name", name],
    ["Duration", dur ? `${dur} Mins` : "—"],
    ["Total Marks", marks || "—"],
    ["Total Questions", total || "—"],
    ["Status", tag],
  ];

  return (
    <VerifyGate>
      <div className="pb-24 px-4 pt-5 max-w-3xl mx-auto">
        <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">Test Instructions</p>
        <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{name}</h1>

        <div className="mt-5 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">{k}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="font-extrabold text-slate-900 dark:text-white">Instructions</h2>
          {loading ? (
            <div className="mt-3 space-y-2">
              <div className="shimmer h-4 rounded w-full" />
              <div className="shimmer h-4 rounded w-3/4" />
              <div className="shimmer h-4 rounded w-1/2" />
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2 whitespace-pre-line">
              <p>
                {instructions?.instructions ||
                  instructions?.description ||
                  detail?.instructions ||
                  "• Test ek baar start karne ke baad timer chalna shuru ho jayega.\n• Har question ke liye sahi option select karo aur Next dabao.\n• Time khatam hone par test auto-submit ho jayega.\n• Result test submit karne ke baad dikhega."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/study/batch/${id}/tests`}
            className="flex-1 text-center py-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
          >
            Back to Tests
          </Link>
          <button
            onClick={() => alert("Test player jald aa raha hai — abhi ke liye instructions padh lo.")}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)] active:scale-95 transition-all"
          >
            {tag === "Resume" ? "Resume Test" : "Start Test"}
          </button>
        </div>
      </div>
    </VerifyGate>
  );
}
