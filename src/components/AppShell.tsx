"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Toast from "./Toast";
import Petals from "./Petals";
import { getAuth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; phone?: string; membership?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let loginRequired = false;
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (typeof data?.loginRequired === "boolean") loginRequired = data.loginRequired;
      } catch {}
      const auth = getAuth();
      if (!auth && loginRequired) {
        router.replace("/auth");
        return;
      }
      if (auth) setUser({ name: auth.name || "Student", phone: auth.phone, membership: "Active Member" });
      else setUser({ name: "Guest", phone: "", membership: "Guest" });
      setLoading(false);
      try {
        if (localStorage.getItem("theme") === "dark") {
          document.documentElement.classList.add("dark");
          setDark(true);
        }
      } catch {}
    })();
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleTheme = useCallback(() => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    const isDark = el.classList.contains("dark");
    setDark(isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-spring-mint/5 to-spring-leaf/10 dark:from-slate-950 dark:via-spring-leaf/10 dark:to-spring-mint/10">
        <img src={APP_CONFIG.LOGO} alt={APP_CONFIG.NAME} width={56} height={56} className="animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-spring-mint/5 to-spring-leaf/5 dark:from-slate-950 dark:via-spring-leaf/10 dark:to-spring-mint/10">
      <Petals />
      <Toast />
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 xl:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-transparent via-spring-mint/5 to-spring-leaf/5 dark:via-spring-mint/5 dark:to-spring-leaf/5 relative z-[1]">
        <Header user={user} dark={dark} onToggleTheme={toggleTheme} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-gradient-to-b from-spring-leaf/5 dark:from-spring-leaf/5">{children}</main>
      </div>
    </div>
  );
}
