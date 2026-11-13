"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getBatchDetails, getContents, getLectureDetails, getDppQuizzes, pdfUrl } from "@/lib/api";
import { getDoneSet, toggleDone, pushHistory, toast } from "@/lib/storage";
import LectureModal from "@/components/LectureModal";
import VerifyGate from "@/components/VerifyGate";
import { Play, FileText, Check, Clock, Calendar, Download, Printer, ExternalLink } from "lucide-react";

const TABS = [
  { key: "videos", label: "Lectures", kind: "lecture" },
  { key: "notes", label: "Notes", kind: "note" },
  { key: "DppNotes", label: "DPP PDFs", kind: "note" },
  { key: "DppVideos", label: "DPP Videos", kind: "lecture" },
];
const FILTERS = [{ key: "all", label: "All" }, ...TABS, { key: "quiz", label: "DPP Quiz" }];

function fmtDate(d: any) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

const hasHomework = (e: any) => Array.isArray(e?.homeworkIds);
const hasVideo = (e: any) => !!e?.videoDetails && (e.videoDetails.videoUrl || e.videoDetails.image || e.videoDetails.name);
const matches = (key: string, e: any) => {
  if (key === "notes") return hasHomework(e) && !e.isDPPNotes;
  if (key === "DppNotes") return hasHomework(e) && !!e.isDPPNotes;
  if (key === "videos") return hasVideo(e) && !e.isDPPVideos;
  if (key === "DppVideos") return hasVideo(e) && !!e.isDPPVideos;
  return false;
};
const titleOf = (e: any) =>
  (e?.topic || (e?.homeworkIds?.[0]?.topic as string) || e?._id || "").toString().slice(0, 80);

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
          <div className="shimmer aspect-video rounded-2xl mb-3" />
          <div className="space-y-2">
            <div className="shimmer h-3 rounded w-24" />
            <div className="shimmer h-4 rounded w-full" />
            <div className="shimmer h-4 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChapterPage() {
  const { id, subjectId, tag } = useParams() as { id: string; subjectId: string; tag: string };
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [subjectName, setSubjectName] = useState(searchParams.get("sub") || "");
  const [chapterName] = useState(searchParams.get("name") || "Chapter");
  const [byKey, setByKey] = useState<Record<string, { items: any[]; page: number; done: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizPage, setQuizPage] = useState(1);
  const [quizDone, setQuizDone] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizLoadingMore, setQuizLoadingMore] = useState(false);
  const [openPdf, setOpenPdf] = useState<string | null>(null);

  useEffect(() => {
    setDoneSet(getDoneSet());
  }, []);

  useEffect(() => {
    getBatchDetails(id)
      .then((e) => {
        const data = (e as any)?.data || e;
        const found = ((data as any)?.subjects || []).find((s: any) => s._id === subjectId);
        if (found) setSubjectName(found.subject);
      })
      .catch(() => {});
  }, [id, subjectId]);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all(
      TABS.map((t) =>
        getContents(id, subjectId, t.key, tag, 1)
          .then((e) => ({ key: t.key, rows: (e as any)?.data || [] }))
          .catch(() => ({ key: t.key, rows: [] }))
      )
    ).then((results) => {
      const map: Record<string, any> = {};
      results.forEach(({ key, rows }) => {
        const seen = new Set<string>();
        const items = rows.filter((r: any) => {
          if (!matches(key, r)) return false;
          const t = titleOf(r);
          if (seen.has(t)) return false;
          seen.add(t);
          return true;
        });
        map[key] = { items, page: 1, done: rows.length < 20 };
      });
      setByKey(map);
      setLoading(false);
    });
  }, [id, subjectId, tag]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadMore = (key: string) => {
    setLoadingMore(true);
    const nextPage = (byKey[key]?.page || 1) + 1;
    getContents(id, subjectId, key, tag, nextPage)
      .then((e) => {
        const rows = (e as any)?.data || [];
        setByKey((prev) => {
          const cur = prev[key] || { items: [], page: 1, done: false };
          const seen = new Set(cur.items.map(titleOf));
          const fresh = rows.filter((r: any) => matches(key, r) && !cur.items.some((x: any) => x._id === r._id) && !seen.has(titleOf(r)));
          return { ...prev, [key]: { items: [...cur.items, ...fresh], page: cur.page + 1, done: rows.length < 20 } };
        });
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const loadMoreAll = () => {
    const keys = TABS.filter((t) => !(byKey[t.key]?.done)).map((t) => t.key);
    if (!keys.length) return;
    setLoadingMore(true);
    Promise.all(
      keys.map((k) =>
        getContents(id, subjectId, k, tag, (byKey[k]?.page || 1) + 1)
          .then((e) => ({ key: k, rows: (e as any)?.data || [] }))
          .catch(() => ({ key: k, rows: [] }))
      )
    ).then((results) => {
      setByKey((prev) => {
        const next = { ...prev };
        results.forEach(({ key, rows }) => {
          const cur = next[key] || { items: [], page: 1, done: false };
          const seen = new Set(cur.items.map(titleOf));
          const fresh = rows.filter((r: any) => matches(key, r) && !cur.items.some((x: any) => x._id === r._id) && !seen.has(titleOf(r)));
          next[key] = { items: [...cur.items, ...fresh], page: cur.page + 1, done: rows.length < 20 };
        });
        return next;
      });
      setLoadingMore(false);
    });
  };

  const openLecture = (item: any) => {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    pushHistory({ subjectId, tag, kind: item._kind === "note" ? "note" : "lecture", contentId: item._id, title: item.topic || titleOf(item) });
    getLectureDetails(id, subjectId, item._id)
      .then((e) => {
        setDetail((e as any)?.data || null);
        setDetailLoading(false);
      })
      .catch(() => {
        setDetail(false);
        setDetailLoading(false);
      });
  };

  const onToggleDone = (item: any) => {
    const next = toggleDone(item._id);
    setDoneSet(new Set(next));
    toast(next.has(item._id) ? `You've marked "${(item.topic || "this content").slice(0, 60)}" as complete.` : `Marked "${(item.topic || "this content").slice(0, 60)}" as incomplete.`);
  };

  const loadQuizzes = (page: number, append: boolean) => {
    if (append) setQuizLoadingMore(true);
    else setQuizLoading(true);
    getDppQuizzes(id, subjectId, tag, page)
      .then((e) => {
        const rows = (e as any)?.data || [];
        setQuizzes((prev) => {
          const seen = new Set(prev.map((q: any) => q.test?._id));
          const fresh = rows.filter((q: any) => q?.test && !seen.has(q.test._id));
          return [...prev, ...fresh];
        });
        setQuizPage(page);
        setQuizDone(rows.length < 50);
      })
      .catch(() => {
        if (page > 1) setQuizDone(true);
      })
      .finally(() => {
        setQuizLoading(false);
        setQuizLoadingMore(false);
      });
  };

  useEffect(() => {
    if (filter !== "quiz" || quizLoading || quizzes.length > 0 || quizDone) return;
    loadQuizzes(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const hasMore = filter === "quiz" ? !quizDone : filter === "all" ? TABS.some((t) => !byKey[t.key]?.done) : !byKey[filter]?.done;

  const visible: any[] =
    filter === "quiz"
      ? []
      : filter === "all"
        ? TABS.flatMap((t) => (byKey[t.key]?.items || []).map((a: any) => ({ ...a, _type: t.key, _kind: t.kind, _label: t.label }))).sort(
            (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          )
        : (() => {
            const t = TABS.find((x) => x.key === filter);
            return (byKey[filter]?.items || []).filter((e: any) => matches(filter, e)).map((e: any) => ({ ...e, _type: filter, _kind: t?.kind || "lecture", _label: t?.label || "" }));
          })();

  const quizCard = (q: any, idx: number) => {
    const test = q.test || {};
    const name = test.name || "DPP Quiz";
    const isResume = q.tag === "Resume";
    const href = `/study/batch/${id}/${subjectId}/quiz/${test._id}?schedule=${encodeURIComponent(q.scheduleId || "")}&tag=${isResume ? "Resume" : "Start"}&free=${q.isFree ? "true" : "false"}&name=${encodeURIComponent(name)}&dur=${test.maxDuration || 0}&marks=${test.totalMarks || 0}&total=${test.totalQuestions || 0}`;
    return (
      <div key={test._id || idx} className="rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)]">
        <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
          <span className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6" />
              <path d="M9 16h4" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-white text-[15px] leading-snug line-clamp-2">{name}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {test.totalQuestions ? `${test.totalQuestions} Questions` : "Quiz"}
              {test.totalMarks ? ` • ${test.totalMarks} Marks` : ""}
              {test.maxDuration ? ` • ${test.maxDuration} Mins` : ""}
            </p>
          </div>
          <Link
            href={href}
            className={`shrink-0 text-[13px] font-extrabold px-4 py-2.5 rounded-full active:scale-95 transition-transform ${
              isResume
                ? "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20"
                : "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)] active:shadow-[0_1px_0_0_rgba(6,43,95,0.45)]"
            }`}
          >
            {isResume ? "Resume" : "Start"}
          </Link>
        </div>
      </div>
    );
  };

  const videoCard = (item: any) => {
    const vd = item.videoDetails || {};
    const img = vd.image || "";
    const label = item._type === "DppVideos" ? "DPP" : "Lecture";
    const done = doneSet.has(item._id);
    return (
      <div
        key={`${item._type || "x"}-${item._id}`}
        className={`rounded-[24px] p-[1.5px] shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)] ${
          done
            ? "bg-gradient-to-br from-blue-400/80 via-white/80 to-blue-300/70"
            : "bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70"
        }`}
      >
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 overflow-hidden">
          <div className="relative cursor-pointer group" onClick={() => openLecture(item)}>
            {img ? (
              <img src={img} alt="" className="w-full aspect-video object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-4xl">▶️</div>
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                <Play className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" />
              </span>
            </span>
            <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full">{label}</span>
            {vd.duration && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Clock size={11} /> {vd.duration}
              </span>
            )}
          </div>
          <div className="p-4 flex items-start gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone(item);
              }}
              aria-label={done ? "Marked complete" : "Mark complete"}
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform mt-0.5 ${
                done ? "bg-blue-500 text-white" : "border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openLecture(item)}>
              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={11} /> {fmtDate(item.date)} • {item._label}
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-snug mt-1 line-clamp-2">{item.topic || vd.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const noteCard = (item: any) => {
    const hws: any[] = item.homeworkIds || [];
    const done = doneSet.has(item._id);
    return (
      <div key={`${item._type || "x"}-${item._id}`} className="rounded-[24px] p-[1.5px] bg-gradient-to-br from-blue-300/70 via-white/80 to-indigo-300/70 shadow-[0_10px_24px_-12px_rgba(6,43,95,0.35)]">
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[22px] border border-white/70 dark:border-slate-700/60 p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleDone(item)}
              aria-label={done ? "Marked complete" : "Mark complete"}
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform mt-0.5 ${
                done ? "bg-blue-500 text-white" : "border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={11} /> {fmtDate(item.date)} • {item._label}
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-snug mt-1">{hws[0]?.topic || item.topic || "Notes"}</p>
            </div>
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
          </div>
          <div className="mt-3 space-y-2">
            {hws.map((hw: any) =>
              (hw.attachmentIds || []).map((a: any) => {
                const url = pdfUrl(a);
                const isOpen = openPdf === a._id;
                return (
                  <div key={a._id} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 p-2.5">
                      <span className="text-xs font-semibold truncate flex-1">{a.name || "PDF"}</span>
                      <button
                        onClick={() => setOpenPdf(isOpen ? null : a._id)}
                        className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white active:scale-95"
                      >
                        {isOpen ? "Close" : "Open"}
                      </button>
                      <a href={url} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700" title="Download">
                        <Download size={15} />
                      </a>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700" title="Print">
                        <Printer size={15} />
                      </a>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700" title="Open">
                        <ExternalLink size={15} />
                      </a>
                    </div>
                    {isOpen && url && <iframe src={url} title={a.name} className="w-full h-[380px] bg-white border-t border-slate-100 dark:border-slate-700" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <VerifyGate>
      <div className="pb-24 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="px-4 pt-5">
          <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">{subjectName || "Subject"}</p>
          <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{chapterName}</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5">Lectures, notes, DPP PDFs aur DPP videos — sab yahin</p>
        </div>

        <div className="px-4 mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                filter === f.key
                  ? "text-white bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)]"
                  : "text-slate-700 dark:text-slate-200 bg-white/55 dark:bg-slate-900/60 backdrop-blur-xl border border-white/70 dark:border-slate-700/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="px-4 mt-4">
          {loading ? (
            <Skeleton />
          ) : filter === "quiz" ? (
            quizLoading ? (
              <Skeleton />
            ) : quizzes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Is chapter mein abhi koi DPP quiz nahi hai.</p>
              </div>
            ) : (
              <div className="space-y-3">{quizzes.map((q, i) => quizCard(q, i))}</div>
            )
          ) : visible.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Is filter mein abhi kuch nahi hai.</p>
            </div>
          ) : (
            <div className="space-y-3">{visible.map((item) => (item._kind === "note" ? noteCard(item) : videoCard(item)))}</div>
          )}

          {hasMore && !loading && (
            <button
              onClick={() => {
                if (filter === "quiz") loadQuizzes(quizPage + 1, true);
                else if (filter === "all") loadMoreAll();
                else loadMore(filter);
              }}
              disabled={loadingMore || quizLoadingMore}
              className="w-full mt-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-blue-200 dark:border-blue-500/30 text-sm font-bold text-blue-700 dark:text-blue-400 shadow-sm disabled:opacity-60"
            >
              {loadingMore || quizLoadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>

        <LectureModal
          detail={detail}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          batchId={id}
          subjectId={subjectId}
          scheduleId={selected?._id || ""}
        />
      </div>
    </VerifyGate>
  );
}
