"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTestFilters, getTests } from "@/lib/api";
import VerifyGate from "@/components/VerifyGate";

const STATUS_FILTERS = [
  { key: "All", label: "All" },
  { key: "Attempted", label: "Attempted" },
  { key: "NonAttempted", label: "Non-Attempted" },
  { key: "Resume", label: "Resume" },
];

function matchesStatus(filter: string, t: any) {
  if (filter === "All") return true;
  if (filter === "Attempted") return t.testActivityStatus === "Completed" || (t.attempts || 0) > 0;
  if (filter === "NonAttempted") return !(t.testActivityStatus === "Completed" || (t.attempts || 0) > 0);
  if (filter === "Resume") return t.tag2 === "Resume";
  return true;
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70">
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
            <div className="shimmer h-4 rounded w-2/3" />
            <div className="shimmer h-3 rounded w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function retry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 900 * (i + 1)));
    }
  }
  throw last;
}

export default function TestsPage() {
  const { id } = useParams() as { id: string };
  const [isSubjective, setIsSubjective] = useState(false);
  const [filters, setFilters] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingTests, setLoadingTests] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoadingFilters(true);
    setError("");
    retry(() => getTestFilters(id, isSubjective))
      .then((t: any) => {
        if (!alive) return;
        setFilters(t || {});
        const list: any[] = [];
        ((t as any)?.categorySections || []).forEach((cat: any) =>
          (cat.sections || []).forEach((s: any) => list.push({ ...s, categoryName: cat.categoryName, categoryId: cat.categoryId }))
        );
        setSections(list);
        if (list.length) setActiveSection(list[0].id);
        setLoadingFilters(false);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message || "Filters load nahi hue");
        setLoadingFilters(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isSubjective, reloadKey]);

  const loadTests = useCallback(
    (sectionId: string) => {
      if (!sectionId) return;
      setLoadingTests(true);
      setError("");
      retry(() => getTests(sectionId, id, isSubjective))
        .then((t: any) => {
          setTests(Array.isArray(t) ? t : []);
          setLoadingTests(false);
        })
        .catch((e: any) => {
          setTests([]);
          setLoadingTests(false);
          setError(e?.message || "Tests load nahi hue");
        });
    },
    [id, isSubjective]
  );

  useEffect(() => {
    if (activeSection) loadTests(activeSection);
  }, [activeSection, loadTests]);

  const filtered = tests.filter((t) => matchesStatus(statusFilter, t));

  return (
    <VerifyGate>
      <div className="pb-24 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="px-4 pt-5">
          <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 dark:text-blue-400 uppercase">Test Series</p>
          <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">Tests</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5">AITS, practice tests aur unke result — sab yahin</p>
        </div>

        <div className="px-4 mt-5">
          <div className="flex gap-2 mb-3">
            {[
              ["Objective", false],
              ["Subjective", true],
            ].map(([label, val]: any) => (
              <button
                key={label}
                onClick={() => setIsSubjective(val)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                  isSubjective === val
                    ? "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)]"
                    : "text-slate-700 dark:text-slate-200 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl border border-white/70 dark:border-slate-700/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filters && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3 -mx-1 px-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                    statusFilter === f.key
                      ? "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)]"
                      : "text-slate-700 dark:text-slate-200 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl border border-white/70 dark:border-slate-700/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {sections.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3 -mx-1 px-1">
              {sections.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                    activeSection === s.id
                      ? "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)]"
                      : "text-slate-700 dark:text-slate-200 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl border border-white/70 dark:border-slate-700/60"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {loadingFilters ? (
            <Skeleton />
          ) : error && tests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setReloadKey((k) => k + 1);
                  if (activeSection) loadTests(activeSection);
                }}
                className="mt-3 px-5 py-2 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)] active:scale-95 transition-all"
              >
                Dobara try karo
              </button>
            </div>
          ) : loadingTests ? (
            <Skeleton />
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Is filter mein koi test nahi mila.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t: any) => {
                const isResume = t.tag2 === "Resume";
                const isMissed = t.tag1 === "Missed" && !isResume && t.testActivityStatus !== "Completed";
                const isLive = t.tag1 === "Live" || t.tag1 === "NEW";
                return (
                  <Link
                    key={t._id}
                    href={`/study/batch/${id}/tests/${t._id}?name=${encodeURIComponent(t.name || "Test")}&dur=${t.maxDuration || 0}&marks=${t.totalMarks || 0}&total=${t.totalQuestions || 0}&tag=${encodeURIComponent(t.tag2 || "Start")}`}
                    className="group block rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)] transition-all duration-150 active:translate-y-[3px] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
                      <span className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                          <rect x="9" y="3" width="6" height="4" rx="1" />
                          <path d="M9 12h6" />
                          <path d="M9 16h4" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-900 dark:text-white text-[15px] leading-snug line-clamp-2">{t.name || "Test"}</p>
                        <p className="text-[12px] text-slate-400 dark:text-slate-400 mt-0.5">
                          {t.totalQuestions ? `${t.totalQuestions} Questions` : ""}
                          {t.totalMarks ? ` • ${t.totalMarks} Marks` : ""}
                          {t.maxDuration ? ` • ${t.maxDuration} Mins` : ""}
                          {t.attempts ? ` • ${t.attempts} Attempts` : ""}
                        </p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {isLive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">LIVE</span>}
                          {isMissed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">MISSED</span>}
                          {t.testActivityStatus === "Completed" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">COMPLETED</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[13px] font-extrabold px-4 py-2.5 rounded-full active:scale-95 transition-transform ${
                          isResume
                            ? "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20"
                            : "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)]"
                        }`}
                      >
                        {isResume ? "Resume" : "Start"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </VerifyGate>
  );
}
