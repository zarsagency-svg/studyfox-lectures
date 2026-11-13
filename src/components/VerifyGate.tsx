"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

async function getVerifyRequired(): Promise<boolean> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const data = await res.json();
    return !!data?.verifyRequired;
  } catch {
    return false;
  }
}

async function checkVerify(force = false): Promise<boolean> {
  try {
    const token = localStorage.getItem("sp_vt");
    if (!token) return false;
    if (!force && (window as any).__sp_vt_ok && Date.now() - (window as any).__sp_vt_t < 5 * 60 * 1000) return true;
    const res = await fetch("/api/verify/check", { headers: { "x-verify-token": token }, cache: "no-store" });
    const data = await res.json();
    const ok = !!data?.ok;
    if (ok) {
      (window as any).__sp_vt_ok = true;
      (window as any).__sp_vt_t = Date.now();
    }
    return ok;
  } catch {
    return false;
  }
}

export function saveVerifyBack(url: string) {
  try {
    sessionStorage.setItem("sp_vback", url);
  } catch {}
}

export function takeVerifyBack(): string {
  try {
    const v = sessionStorage.getItem("sp_vback") || "";
    sessionStorage.removeItem("sp_vback");
    return v;
  } catch {
    return "";
  }
}

export default function VerifyGate({ children, onPass }: { children: React.ReactNode; onPass?: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<"check" | "pass" | "block">("check");
  const [starting, setStarting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const required = await getVerifyRequired();
      if (!alive) return;
      if (!required) {
        setState("pass");
        return;
      }
      const ok = await checkVerify();
      if (!alive) return;
      setState(ok ? "pass" : "block");
      if (ok) onPass?.();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== "block") return;
    const iv = setInterval(async () => {
      try {
        const ok = await checkVerify(true);
        if (ok) {
          setState("pass");
          setDone(true);
          onPass?.();
        }
      } catch {}
    }, 5000);
    const onVis = () => {
      if (!document.hidden) checkVerify(true).then((ok) => ok && (setState("pass"), setDone(true), onPass?.()));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      saveVerifyBack(window.location.href);
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ back: window.location.href }),
      });
      const data = await res.json();
      if (!data.success || !data.link) throw new Error(data.message || "Link nahi ban paya, thodi der baad try karo");
      window.open(data.link, "_blank", "noopener");
      setWaiting(true);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setStarting(false);
  };

  if (state === "check") return null;
  if (state === "pass") return <>{children}</>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {done ? (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-blue-100 dark:border-blue-500/25 p-8 text-center shadow-[0_20px_50px_-24px_rgba(6,43,95,0.45)]">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-2xl text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.7)]">
              ✓
            </div>
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-white mt-4">Verify ho gaya!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">24 ghante ka access unlock ho gaya. Khul raha hai...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-blue-100 dark:border-blue-500/25 p-7 sm:p-8 shadow-[0_20px_50px_-24px_rgba(6,43,95,0.45)] text-center">
            <p className="text-[12px] font-extrabold tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase">Verify Required</p>
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-white mt-2">Is content ke liye verify zaroori hai</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {waiting
                ? "Verify link khul gaya hai. Us page par verify complete karo, phir yahin wapas aa jao — auto unlock ho jayega."
                : "Key generate karne ke liye verify page par jao. Ek baar verify karne se 24 ghante tak access milega."}
            </p>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <button
              onClick={start}
              disabled={starting}
              className="mt-5 w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-600 text-white text-sm font-bold shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] active:scale-[.98] transition-all disabled:opacity-60"
            >
              {starting ? "Link ban raha hai..." : waiting ? "Dobara link kholo" : "Verify karo →"}
            </button>
            <button onClick={() => router.push("/verify")} className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 underline underline-offset-4">
              Verify page par jao
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
