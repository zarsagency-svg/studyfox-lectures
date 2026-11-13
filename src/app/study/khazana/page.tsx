"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBatchDetails } from "@/lib/api";
import { Boxes, FileText, Play, ExternalLink } from "lucide-react";

function KhazanaInner() {
  const sp = useSearchParams();
  const batchId = sp.get("batch") || "";
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    getBatchDetails(batchId)
      .then((e: any) => {
        setBatch(e?.data || e);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [batchId]);

  return (
    <div className="pb-24 px-4 pt-5 max-w-4xl mx-auto">
      <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">Khazana</p>
      <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{batch?.name || "Study Material"}</h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5">Notes, PDFs, mind maps aur extra books — sab ek jagah</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-20 rounded-2xl" />
          ))}
        </div>
      ) : !batch ? (
        <div className="mt-6 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Batch select karo pehle — Study page se batch choose karo.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-5 text-white flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Boxes size={24} />
            </span>
            <div>
              <p className="font-extrabold">{batch.subjects?.length || 0} Subjects</p>
              <p className="text-xs text-white/80">Har subject ke chapters mein notes aur PDFs milenge</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(batch.subjects || []).map((s: any) => (
              <a
                key={s._id}
                href={`/study/batch/${batchId}/${s._id}`}
                className="flex items-center gap-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm active:scale-[0.98] transition-all"
              >
                <span className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm text-slate-900 dark:text-white truncate">{s.subject}</span>
                  <span className="block text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Play size={11} /> Chapters kholo aur PDFs dekho
                  </span>
                </span>
                <ExternalLink size={16} className="text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KhazanaPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-5"><div className="shimmer h-40 rounded-3xl" /></div>}>
      <KhazanaInner />
    </Suspense>
  );
}
