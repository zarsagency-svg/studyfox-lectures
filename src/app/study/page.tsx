"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorPlay, ClipboardList, Boxes, Users, ChevronDown, Bell, Share2, Clock, Send } from "lucide-react";
import { getBatchDetails, getTodaysSchedule, getAnnouncements } from "@/lib/api";
import { getEnrolled, getActiveBatch, setActiveBatch, getHistory } from "@/lib/storage";
import { APP_CONFIG } from "@/lib/config";

function TelegramModal() {
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (!open || count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, count]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="glass-modal w-full max-w-sm max-h-[90vh] overflow-hidden relative flex flex-col animate-scaleIn rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-gray-900/95">
        <div className="sticky top-0 z-10 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800/60 bg-transparent backdrop-blur-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">Telegram Community !!</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-gray-400" size={12} />
              {count}s
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all duration-200">
              ×
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-grow p-5 space-y-3">
          <img src="/telegram-community.jpg" alt="Telegram Community" className="rounded-xl w-full max-h-56 object-cover shadow-sm border border-gray-100 dark:border-gray-800" loading="lazy" />
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed text-center font-medium">
            Join The Channel For Latest Updates 👍 Don&apos;t miss any Future updates!
          </p>
        </div>
        <div className="sticky bottom-0 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800/60 p-4 bg-gray-50/50 dark:bg-gray-900/50">
          <a
            href={APP_CONFIG.TELEGRAM_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200 active:scale-95"
          >
            <Send className="w-4 h-4" size={16} />
            Join Now!
          </a>
        </div>
      </div>
    </div>
  );
}

export default function StudyHomePage() {
  const router = useRouter();
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState("");
  const [batch, setBatch] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [annOpen, setAnnOpen] = useState(false);
  const [annItems, setAnnItems] = useState<any[]>([]);
  const [annPage, setAnnPage] = useState(0);
  const [annLoading, setAnnLoading] = useState(false);
  const [annDone, setAnnDone] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherQuery, setSwitcherQuery] = useState("");
  const [batchNames, setBatchNames] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const ids = getEnrolled().map((e: any) => (typeof e === "string" ? e : e._id || e.id)).filter(Boolean);
    setEnrolledIds(ids);
    const saved = getActiveBatch();
    const initial = saved && ids.includes(saved) ? saved : ids[0] || "";
    setActiveId(initial);
    setHistory(getHistory());
    try {
      const cached = JSON.parse(localStorage.getItem("sp_batch_names") || "{}");
      setBatchNames(cached);
    } catch {}
  }, []);

  useEffect(() => {
    if (!activeId) {
      setBatch(null);
      setSchedule([]);
      return;
    }
    setActiveBatch(activeId);
    getBatchDetails(activeId)
      .then((e: any) => {
        const data = e?.data || e;
        if (data?.name) {
          setBatch(data);
          setBatchNames((prev) => {
            const next = { ...prev, [activeId]: data.name };
            try {
              localStorage.setItem("sp_batch_names", JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      })
      .catch(() => {});
    getTodaysSchedule(activeId)
      .then((e: any) => setSchedule(e?.data || []))
      .catch(() => setSchedule([]));
  }, [activeId]);

  const loadAnn = (page: number) => {
    setAnnLoading(true);
    getAnnouncements(activeId, page)
      .then((e: any) => {
        const rows = e?.data || [];
        setAnnItems((prev) => (page === 1 ? rows : [...prev, ...rows.filter((r: any) => !prev.some((x: any) => x._id === r._id))]));
        setAnnPage(page);
        setAnnDone(rows.length < 10);
        setAnnLoading(false);
      })
      .catch(() => {
        setAnnLoading(false);
        setAnnDone(true);
      });
  };

  const teacherImgs: Record<string, string> = {};
  (batch?.subjects || []).forEach((s: any) => {
    const t = (s?.teacherIds || [])[0];
    const img = t?.imageId ? `${t.imageId.baseUrl || ""}${t.imageId.key || ""}` : "";
    if (img) {
      if (s.subjectId) teacherImgs[s.subjectId] = img;
      if (s._id) teacherImgs[s._id] = img;
    }
  });

  const quick = [
    { icon: MonitorPlay, label: "All Classes", bg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300", onClick: () => activeId && router.push(`/study/batch/${activeId}`) },
    { icon: ClipboardList, label: "All Tests", bg: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300", onClick: () => activeId && router.push(`/study/batch/${activeId}/tests`) },
    { icon: Boxes, label: "Khazana", bg: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300", onClick: () => activeId && router.push(`/study/khazana?batch=${activeId}`) },
    { icon: Users, label: "Community", bg: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300", onClick: () => alert("Community demo mein coming soon") },
  ];

  const filteredEnrolled = enrolledIds.filter((id) => (batchNames[id] || "").toLowerCase().includes(switcherQuery.toLowerCase()));

  if (!activeId) {
    return (
      <div className="px-4 pt-4 space-y-5 pb-24">
        <TelegramModal />
        <div className="bg-gradient-to-br from-[#101c30] to-[#1b2a44] rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase relative z-10">Your Batch</p>
          <h1 className="text-2xl font-extrabold mt-1.5 relative z-10">Select your batch</h1>
          <p className="text-sm text-slate-300 mt-2 relative z-10">Pehle Batches page se enroll karo, phir padhai yahin se shuru hogi.</p>
          <Link href="/study/batches" className="inline-flex mt-4 px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-bold active:scale-95 relative z-10">
            Explore Batches
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quick.map((q) => (
            <button key={q.label} onClick={q.onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/70 dark:border-slate-700/60 active:scale-95 transition-all">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${q.bg}`}>
                <q.icon size={20} />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-[1] pb-24">
      <TelegramModal />
      <div className="px-4 pt-4 space-y-5">
        <div className="bg-gradient-to-br from-[#101c30] to-[#1b2a44] rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Your Batch</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/study`;
                  const text = batch ? `${batch.name} - ${APP_CONFIG.NAME}` : APP_CONFIG.NAME;
                  const fallback = () => {
                    try {
                      const ta = document.createElement("textarea");
                      ta.value = url;
                      ta.style.position = "fixed";
                      ta.style.opacity = "0";
                      document.body.appendChild(ta);
                      ta.focus();
                      ta.select();
                      const ok = document.execCommand("copy");
                      document.body.removeChild(ta);
                      alert(ok ? "Link copy ho gaya" : `Copy nahi hua. Link: ${url}`);
                    } catch {
                      alert(`Copy nahi hua. Link: ${url}`);
                    }
                  };
                  if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: APP_CONFIG.NAME, text, url }).catch(fallback);
                  else if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext)
                    navigator.clipboard.writeText(url).then(() => alert("Link copy ho gaya")).catch(fallback);
                  else fallback();
                }}
                aria-label="Share"
                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center active:scale-90 transition-transform text-white"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => {
                  setAnnOpen(true);
                  setAnnItems([]);
                  setAnnPage(0);
                  setAnnDone(false);
                  loadAnn(1);
                }}
                aria-label="Announcements"
                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center relative active:scale-90 transition-transform text-white"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48]" />
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setSwitcherOpen(true);
              setSwitcherQuery("");
              enrolledIds.forEach((id) => {
                if (!batchNames[id]) {
                  getBatchDetails(id)
                    .then((e: any) => {
                      const data = e?.data || e;
                      if (data?.name) {
                        setBatchNames((prev) => {
                          const next = { ...prev, [id]: data.name };
                          try {
                            localStorage.setItem("sp_batch_names", JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                      }
                    })
                    .catch(() => {});
                }
              });
            }}
            className="flex items-center gap-2 mt-1.5 text-left w-full"
          >
            <h1 className="text-2xl font-extrabold truncate text-white" style={{ color: "#ffffff" }}>
              {batch?.name || batchNames[activeId] || "Select your batch"}
            </h1>
            <ChevronDown size={20} className="shrink-0 text-slate-300" />
          </button>
          {batch && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {(batch.subjects || []).slice(0, 3).map((s: any) => (
                <span key={s._id} className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-200">
                  {s.subject}
                </span>
              ))}
              {(batch.subjects || []).length > 3 && (
                <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-200">+{(batch.subjects || []).length - 3}</span>
              )}
            </div>
          )}
          {!enrolledIds.includes(activeId) && (
            <p className="text-[11px] text-amber-300 mt-2">Yeh batch pehle enroll page se enroll karo, phir tracking yahin dikhega.</p>
          )}
        </div>

        {annOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45" onClick={() => setAnnOpen(false)}>
            <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-extrabold text-lg text-slate-900 dark:text-white">Announcements</p>
                <button onClick={() => setAnnOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  ✕
                </button>
              </div>
              {annLoading && annItems.length === 0 ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="shimmer h-20 rounded-2xl" />
                  ))}
                </div>
              ) : annItems.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Abhi koi announcement nahi hai.</p>
              ) : (
                <div className="space-y-3">
                  {annItems.map((a: any) => (
                    <div key={a._id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{a.heading || "Announcement"}</p>
                        <span className="text-[10px] text-slate-400 ml-auto">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line">{a.announcement}</p>
                      {a.attachment?.key && (
                        <img src={`${a.attachment.baseUrl || "https://static.pw.live/"}${a.attachment.key}`} alt="" className="mt-2 rounded-xl w-full max-h-40 object-cover" loading="lazy" />
                      )}
                    </div>
                  ))}
                  {!annDone && (
                    <button onClick={() => loadAnn(annPage + 1)} disabled={annLoading} className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-60">
                      {annLoading ? "Loading..." : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {switcherOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45" onClick={() => setSwitcherOpen(false)}>
            <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-extrabold text-lg text-slate-900 dark:text-white">Switch Batch</p>
                <button onClick={() => setSwitcherOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  ✕
                </button>
              </div>
              <input
                value={switcherQuery}
                onChange={(e) => setSwitcherQuery(e.target.value)}
                placeholder="Batch search karo..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none mb-3"
              />
              <div className="space-y-2">
                {filteredEnrolled.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveId(id);
                      setSwitcherOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-bold transition-all active:scale-[0.98] ${
                      id === activeId
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {batchNames[id] || id}
                  </button>
                ))}
                {filteredEnrolled.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Koi batch nahi mila.</p>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {quick.map((q) => (
            <button key={q.label} onClick={q.onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/70 dark:border-slate-700/60 active:scale-95 transition-all">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${q.bg}`}>
                <q.icon size={20} />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{q.label}</span>
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">Today&apos;s Schedule</h2>
          {schedule.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center text-sm text-slate-500 shadow-sm">
              Aaj ke liye koi class schedule nahi hai.
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.slice(0, 8).map((item: any, i: number) => {
                const d = item.data || {};
                const subj = d.subjectId?.name || "";
                const time = d.startTime ? new Date(d.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
                const img = d.videoDetails?.image || teacherImgs[d.subjectId?._id] || teacherImgs[d.batchSubjectId] || "";
                return (
                  <div key={item._id || i} className="flex items-center gap-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm">
                    {img ? (
                      <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" loading="lazy" />
                    ) : (
                      <span className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-xl shrink-0">📺</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{d.topic || "Class"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {subj} {time ? `• ${time}` : ""} {d.tag ? `• ${d.tag}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 shrink-0">
                      {d.lectureType || item.type || "LIVE"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">Recently Opened</h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((h: any, i: number) => (
                <Link
                  key={i}
                  href={`/study/batch/${activeId}/${h.subjectId}/${h.tag}?name=${encodeURIComponent(h.title || "Chapter")}`}
                  className="flex items-center gap-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm active:scale-[0.98] transition-all"
                >
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 text-sm">▶</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{h.title || "Chapter"}</span>
                    <span className="block text-[11px] text-slate-500">{h.kind === "note" ? "Notes" : "Lecture"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
