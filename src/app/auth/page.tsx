"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config";
import { Phone, ShieldCheck, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [resend, setResend] = useState(0);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const sendOtp = async (isResend = false) => {
    if (phone.length < 10) {
      setError("Sahi 10-digit phone number daalo");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, whatsapp, resend: isResend }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "OTP nahi bhej paya");
      setStep("otp");
      setDemoOtp(data.otp || "");
      setResend(30);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setLoading(false);
  };

  const verify = async () => {
    if (otp.length < 4) {
      setError("4-digit OTP daalo");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Verify nahi ho paya");
      setAuth(data.user);
      router.replace("/study");
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-blue-100 dark:border-blue-500/25 p-7 sm:p-8 shadow-[0_20px_50px_-24px_rgba(6,43,95,0.45)]">
          <div className="flex items-center gap-3">
            <img src={APP_CONFIG.LOGO} alt={APP_CONFIG.NAME} className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100" />
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white">{APP_CONFIG.NAME}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Login karo aur padhai shuru karo</p>
            </div>
          </div>

          {step === "phone" ? (
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone size={13} /> Phone Number
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                WhatsApp par OTP bhejo
              </label>
              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
              <button
                onClick={() => sendOtp(false)}
                disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-600 text-white text-sm font-bold shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                OTP Bhejo
              </button>
              <p className="text-[11px] text-slate-400 text-center">OTP aane mein 1-2 minute lag sakte hain. Demo mode mein OTP screen par hi dikhega.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  OTP <b>{phone}</b> par bheja gaya hai.
                  {demoOtp && (
                    <>
                      {" "}
                      Demo OTP: <b className="text-blue-700 dark:text-blue-300">{demoOtp}</b>
                    </>
                  )}
                </span>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">OTP Daalo</span>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="4-digit OTP"
                  inputMode="numeric"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-blue-500 tracking-[0.3em] text-center font-bold"
                />
              </label>
              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
              <button
                onClick={verify}
                disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-600 text-white text-sm font-bold shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Verify & Login
              </button>
              <div className="flex items-center justify-between text-xs font-bold">
                <button onClick={() => setStep("phone")} className="text-slate-500 dark:text-slate-400 underline underline-offset-4">
                  Number badlo
                </button>
                <button onClick={() => sendOtp(true)} disabled={resend > 0 || loading} className="text-blue-600 dark:text-blue-400 disabled:opacity-50">
                  {resend > 0 ? `Resend (${resend}s)` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
