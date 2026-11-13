"use client";

import { useEffect, useState } from "react";

type ToastItem = { msg: string; id: number; leaving: boolean };

export default function Toast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-2), { msg: detail, id, leaving: false }]);
      setTimeout(() => {
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      }, 3400);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3850);
    };
    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  return (
    <section aria-label="Notifications" className="fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2.5 px-4 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 w-full max-w-[360px] rounded-2xl px-4 py-3.5 bg-gradient-to-br from-white/85 to-blue-50/80 dark:from-slate-900/85 dark:to-blue-950/50 backdrop-blur-xl border border-white/70 dark:border-blue-500/25 shadow-[0_12px_40px_rgba(6,43,95,0.28)] ${t.leaving ? "toast-out" : "toast-in"}`}
        >
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <p className="text-[14px] font-semibold leading-snug text-blue-600 dark:text-blue-400">{t.msg}</p>
        </div>
      ))}
    </section>
  );
}
