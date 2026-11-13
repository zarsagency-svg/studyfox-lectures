"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRoundCheck, CalendarCheck2, CircleX, BookOpen } from "lucide-react";
import { enrollBatch, unenrollBatch, isEnrolled, toast } from "@/lib/storage";

function formatDate(d: any) {
  if (!d) return "";
  if (typeof d === "string") return d;
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function BatchCard({ b, enrolledView }: { b: any; enrolledView?: boolean }) {
  const name = b.name || b.title || "Batch";
  const language = b.language || b.languageTag || "Hinglish";
  const byName = b.byName || b.description || b.subtitle || "";
  const image = b.previewImage || b.image || b.imageUrl || b.banner || b.thumbnail || "";
  const fee = Number(b.feeTotal ?? 0);
  const [enrolled, setEnrolled] = useState(false);
  const id = b._id || b.id || "";
  const href = `/study/batch/${id}`;

  useEffect(() => {
    setEnrolled(!!enrolledView || isEnrolled(b));
  }, [enrolledView, b]);

  return (
    <div className="glass-card !rounded-2xl p-4 flex flex-col animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="text-lg font-bold leading-snug text-[#0f172a] dark:text-gray-100 hover:text-spring-leaf transition-colors">
          {name}
        </Link>
        <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 shadow-sm">
          New
        </span>
      </div>

      <Link href={href} className="relative mt-3 block">
        {image ? (
          <img src={image} alt={name} className="rounded-xl w-full h-40 object-cover" loading="lazy" />
        ) : (
          <div className="rounded-xl w-full h-40 bg-gradient-to-br from-spring-leaf/25 to-spring-mint/25 flex items-center justify-center text-4xl">
            🎓
          </div>
        )}
        <span className="absolute bottom-2 left-2 bg-gradient-to-r from-spring-mint to-spring-leaf text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
          {language}
        </span>
      </Link>

      {byName && (
        <div className="flex items-center gap-2 mt-4">
          <UserRoundCheck className="w-5 h-5 text-spring-leaf flex-shrink-0" size={20} />
          <span className="text-sm font-bold text-[#0f172a] dark:text-gray-100">{byName}</span>
        </div>
      )}

      <div className="flex items-center mt-3 bg-spring-leaf/5 dark:bg-spring-mint/5 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <CalendarCheck2 className="w-5 h-5 text-spring-leaf flex-shrink-0" size={20} />
          <div className="leading-tight min-w-0">
            <div className="text-[11px] text-muted-foreground">Starts on</div>
            <div className="text-sm font-bold text-[#0f172a] dark:text-gray-100 truncate">{formatDate(b.startDate || b.startsOn)}</div>
          </div>
        </div>
        <div className="w-px h-8 bg-spring-leaf/15 mx-2" />
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <CalendarCheck2 className="w-5 h-5 text-spring-leaf flex-shrink-0" size={20} />
          <div className="leading-tight min-w-0">
            <div className="text-[11px] text-muted-foreground">Ends on</div>
            <div className="text-sm font-bold text-[#0f172a] dark:text-gray-100 truncate">{formatDate(b.endDate || b.endsOn)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {fee <= 0 ? (
          <>
            <span className="text-lg font-bold text-spring-leaf">₹ FREE</span>
            <span className="line-through text-sm text-gray-400">₹0</span>
          </>
        ) : (
          <span className="text-lg font-bold text-[#0f172a] dark:text-gray-100">₹ {fee.toLocaleString("en-IN")}</span>
        )}
        <span className="ml-auto bg-spring-leaf/10 border border-spring-leaf/30 text-spring-leaf text-xs font-semibold px-3 py-1.5 rounded-full">
          100% Free For Students
        </span>
      </div>

      <div className="flex gap-3 mt-4">
        <Link href={href} className="spring-btn-ghost flex-1 !px-2 py-2.5 text-sm flex items-center justify-center gap-1.5">
          <BookOpen className="w-4 h-4" size={18} /> Study
        </Link>
        {enrolled ? (
          <button
            onClick={() => {
              unenrollBatch(id);
              setEnrolled(false);
              toast(`You've successfully unenrolled from "${name}".`);
            }}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#E11D48] to-[#F43F5E] hover:from-[#BE123C] hover:to-[#E11D48] active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <CircleX className="w-4 h-4" size={18} /> Unenroll
          </button>
        ) : (
          <button
            onClick={() => {
              enrollBatch(b);
              setEnrolled(true);
              toast(`You've successfully enrolled in "${name}".`);
            }}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-spring-mint to-spring-leaf hover:from-spring-mint-dark hover:to-spring-mint active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <UserRoundCheck className="w-4 h-4" size={18} /> Enroll
          </button>
        )}
      </div>
    </div>
  );
}
