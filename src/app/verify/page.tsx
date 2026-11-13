"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

function VerifyInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tokenParam = sp.get("token") || "";
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = tokenParam || localStorage.getItem("sp_vt") || "";
    if (!token) return;
    setStatus("checking");
    fetch("/api/verify/check", { headers: { "x-verify-token": token }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          localStorage.setItem("sp_vt", token);
          (window as any).__sp_vt_ok = true;
          (window as any).__sp_vt_t = Date.now();
          setStatus("done");
          setTimeout(() => {
            let back = "";
            try {
              back = sessionStorage.getItem("sp_vback") || "";
              sessionStorage.removeItem("sp_vback");
            } catch {}
            if (back) window.location.href = back;
            else router.replace("/study");
          }, 1200);
        } else {
          setStatus("error");
          setMessage("Yeh link expire ho gaya hai ya galat hai. Dobara verify karo.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verify check nahi ho paya. Network check karke dobara try karo.");
      });
  }, [tokenParam, router]);

  const start = async () => {
    setStatus("checking");
    setMessage("");
    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ back: window.location.href }),
      });
      const data = await res.json();
      if (!data.success || !data.link) throw new Error(data.message || "Link nahi ban paya");
      window.open(data.link, "_blank", "noopener");
      setStatus("idle");
      setMessage("Verify link khul gaya hai. Us page par verify complete karo, phir yahin wapas aa jao.");
    } catch (e: any) {
      setStatus("error");
      setMessage(String(e?.message || e));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-blue-100 dark:border-blue-500/25 p-7 sm:p-8 shadow-[0_20px_50px_-24px_rgba(6,43,95,0.45)] text-center">
          {status === "done" ? (
            <>
              <span className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 size={32} />
              </span>
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white mt-4">Verify ho gaya!</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">24 ghante ka access unlock ho gaya hai. Wapas ja rahe ho...</p>
            </>
          ) : (
            <>
              <span className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={32} />
              </span>
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white mt-4">Verify karo</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {status === "checking" ? "Verify check ho raha hai..." : "Content access ke liye ek baar verify karo. 24 ghante tak access milega."}
              </p>
              {message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3">{message}</p>}
              {status === "error" && <p className="text-xs text-red-500 font-semibold mt-2">{message}</p>}
              <button
                onClick={start}
                disabled={status === "checking"}
                className="mt-5 w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-600 text-white text-sm font-bold shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === "checking" && <Loader2 size={16} className="animate-spin" />}
                Verify karo →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="shimmer w-64 h-40 rounded-3xl" /></div>}>
      <VerifyInner />
    </Suspense>
  );
}
