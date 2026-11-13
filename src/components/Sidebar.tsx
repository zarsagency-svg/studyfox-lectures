"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Presentation, GraduationCap, Send, Heart, Contact, ChevronRight, LogOut } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { clearAuth } from "@/lib/auth";

const NAV = [
  { href: "/study", label: "Study", Icon: BookOpen },
  { href: "/study/batches", label: "Batches", Icon: Presentation },
  { href: "/study/mybatches", label: "My Batches", Icon: GraduationCap },
  { href: APP_CONFIG.TELEGRAM_URL, label: "Join Telegram", Icon: Send, external: true },
  { href: "/auth", label: "Donate Batch", Icon: Heart },
  { href: "/contact", label: "Contact Us", Icon: Contact },
];

export default function Sidebar({
  user,
  open,
  onClose,
}: {
  user: { name?: string; phone?: string; membership?: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const name = user?.name || "Student";

  return (
    <aside
      className={`z-50 w-64 bg-gradient-to-b from-spring-leaf/10 to-spring-mint/5 dark:from-spring-leaf/15 dark:to-spring-mint/10 border-r border-spring-leaf/10 dark:border-spring-mint/15 backdrop-blur-[8px] transform transition-all duration-300 ease-in-out flex flex-col justify-between fixed top-0 left-0 h-full ${
        open ? "translate-x-0" : "-translate-x-full"
      } xl:sticky xl:top-0 xl:translate-x-0 xl:h-screen xl:z-auto`}
    >
      <div>
        <div className="p-4 border-b border-spring-leaf/10 dark:border-spring-mint/10 sticky top-0 z-10 flex items-center gap-3 bg-transparent" onClick={onClose}>
          <div className="w-10 h-10 rounded-full dark:bg-spring-mint/10 overflow-hidden ring-2 ring-spring-leaf/20 dark:ring-spring-mint/30 bg-white flex items-center justify-center">
            <img alt={APP_CONFIG.NAME} width={40} height={40} src={APP_CONFIG.LOGO} className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold bg-gradient-to-r from-spring-leaf to-spring-mint dark:from-spring-mint to-spring-mint-dark bg-clip-text text-transparent">
            {APP_CONFIG.NAME}
          </span>
          <GraduationCap className="ml-auto text-spring-leaf dark:text-spring-mint animate-leaf-sway" size={24} />
        </div>
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {NAV.map((item) => {
            const active = !item.external && pathname === item.href;
            const inner = (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
                  active
                    ? "bg-spring-leaf/15 dark:bg-spring-mint/15 text-spring-leaf dark:text-spring-mint border border-spring-leaf/30 dark:border-spring-mint/30 shadow-spring-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-spring-leaf/10 dark:hover:bg-spring-mint/10"
                }`}
              >
                <item.Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-spring-leaf dark:text-spring-mint" : ""}`} size={20} />
                <span className="font-medium">{item.label}</span>
                {active && <ChevronRight className="ml-auto text-spring-leaf dark:text-spring-mint" size={18} />}
              </div>
            );
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <Link key={item.label} href={item.href} onClick={onClose}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-spring-leaf/10 dark:border-spring-mint/10 bg-white/50 dark:bg-[#10141a]/50 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spring-leaf to-spring-mint text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.42 0-8 2.24-8 5v1.5A1.5 1.5 0 0 0 5.5 22h13a1.5 1.5 0 0 0 1.5-1.5V19c0-2.76-3.58-5-8-5Z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-foreground">{name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.phone || user?.membership || "Active Member"}</span>
            </div>
          </div>
          <button
            title="Log Out"
            onClick={() => {
              clearAuth();
              window.location.href = "/auth";
            }}
            className="p-2 rounded-xl text-[#E11D48] hover:bg-[#E11D48]/10 transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
