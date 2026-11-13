"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ChevronLeft, Sun, Moon, GraduationCap, Presentation, LogOut, Phone } from "lucide-react";
import { clearAuth } from "@/lib/auth";

export default function Header({
  user,
  dark,
  onToggleTheme,
  onOpenSidebar,
}: {
  user: { name?: string; phone?: string } | null;
  dark: boolean;
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = user?.name || "Student";

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 glass-navbar bg-gradient-to-r from-spring-leaf/5 to-spring-mint/5 dark:from-spring-leaf/10 dark:to-spring-mint/10 border-b border-spring-leaf/10 dark:border-spring-mint/15 shadow-spring-sm p-2 sm:p-4 flex items-center justify-between">
      <div className="flex items-center gap-2 rounded-xl sm:px-2 py-2 md:ml-0">
        <button
          onClick={onOpenSidebar}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold active:translate-y-[2px] active:scale-95 hover:bg-spring-leaf/15 dark:hover:bg-spring-mint/15 hover:text-spring-leaf dark:hover:text-spring-mint transition-all h-10 w-10 xl:hidden rounded-xl"
        >
          <Menu className="h-6 w-6" />
        </button>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 hover:text-spring-leaf dark:hover:text-spring-mint transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-spring-leaf to-spring-mint text-white flex items-center justify-center text-xs font-bold">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">{name}</span>
          </button>

          {open && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl bg-white/95 dark:bg-[#111a2c] backdrop-blur-xl shadow-spring-lg p-1.5 animate-scaleIn z-50 border border-spring-leaf/10 dark:border-spring-mint/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-3 pt-3 pb-2.5 border-b border-spring-leaf/10 dark:border-spring-mint/10">
                <span className="w-12 h-12 rounded-full bg-gradient-to-br from-spring-leaf to-spring-mint text-white flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white/60 dark:ring-slate-700/60 text-lg font-bold">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate">{user?.phone || "Student"}</span>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/study/mybatches"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-foreground rounded-lg hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-blue-500" /> My Batches
                </Link>
                <Link
                  href="/study/batches"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-foreground rounded-lg hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 transition-colors"
                >
                  <Presentation className="w-4 h-4 text-blue-500" /> Explore Batches
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTheme();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-foreground rounded-lg hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10 transition-colors"
                >
                  {dark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span className="flex-1 text-left">Theme: {dark ? "Dark" : "Light"}</span>
                  <span className="text-[10px] font-extrabold tracking-wide text-muted-foreground bg-slate-500/10 px-2 py-1 rounded-md">TOGGLE</span>
                </button>
              </div>
              <div className="pt-1 border-t border-spring-leaf/10 dark:border-spring-mint/10">
                <button
                  onClick={() => {
                    clearAuth();
                    window.location.href = "/auth";
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-[#E11D48] rounded-lg hover:bg-[#E11D48]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
