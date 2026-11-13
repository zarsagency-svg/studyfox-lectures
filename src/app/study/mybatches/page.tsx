"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BatchCard from "@/components/BatchCard";
import { getEnrolled } from "@/lib/storage";
import { GraduationCap } from "lucide-react";

export default function MyBatchesPage() {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    setList(getEnrolled());
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      <div className="glass-card !rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-spring-mint to-spring-leaf text-white flex items-center justify-center">
            <GraduationCap size={22} />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">My Batches</h1>
            <p className="text-sm text-muted-foreground">Tumhare enrolled batches yahin dikhenge</p>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎓</div>
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">Abhi koi batch enroll nahi kiya</p>
            <p className="text-sm text-muted-foreground mt-1">Batches page se apna batch enroll karo aur padhai shuru karo.</p>
            <Link
              href="/study/batches"
              className="inline-flex mt-5 px-6 py-2.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-spring-mint to-spring-leaf shadow-md active:scale-95 transition-all"
            >
              Explore Batches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((b, i) => (
              <BatchCard key={b._id || b.id || i} b={b} enrolledView />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
