"use client";

import { useState } from "react";
import { APP_CONFIG } from "@/lib/config";
import { Send, Mail, MessageCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    setName("");
    setPhone("");
    setMessage("");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-[900px]">
      <div className="glass-card !rounded-2xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Contact Us</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {APP_CONFIG.NAME} {APP_CONFIG.CONTACT_DESCRIPTION}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <a href={APP_CONFIG.TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 active:scale-[0.98] transition-all">
            <span className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
              <Send size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">Telegram</span>
              <span className="block text-xs text-slate-500">t.me/studyyfox</span>
            </span>
          </a>
          <a href={APP_CONFIG.OWNER_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/25 active:scale-[0.98] transition-all">
            <span className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
              <MessageCircle size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">Owner</span>
              <span className="block text-xs text-slate-500">{APP_CONFIG.OWNER_HANDLE}</span>
            </span>
          </a>
          <a href={`mailto:support@studyfox.eu.cc`} className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25 active:scale-[0.98] transition-all">
            <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Mail size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">Email</span>
              <span className="block text-xs text-slate-500">support@studyfox.eu.cc</span>
            </span>
          </a>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Naam</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tumhara naam" className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-sm outline-none focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-sm outline-none focus:border-blue-500" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Apni baat yahan likho..." rows={5} className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-sm outline-none focus:border-blue-500 resize-y" />
          </label>
          {sent && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25 rounded-xl px-4 py-3">Message bhej diya gaya! Hum jald reply karenge.</p>}
          <button type="submit" disabled={sending} className="w-full sm:w-auto px-8 py-3 rounded-full text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {sending && <Loader2 size={16} className="animate-spin" />}
            Message Bhejo
          </button>
        </form>
      </div>
    </div>
  );
}
