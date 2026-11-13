"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getTestDetail } from "@/lib/api";
import VerifyGate from "@/components/VerifyGate";

type Q = {
  id: string;
  question: string;
  options: string[];
  correct?: number;
  explanation?: string;
};

function parseQuestions(detail: any): Q[] {
  if (!detail) return [];
  const raw = detail.questions || detail.data?.questions || detail.test?.questions || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((q: any, i: number) => ({
    id: q._id || q.id || String(i),
    question: q.question || q.title || q.text || `Question ${i + 1}`,
    options: q.options || q.choices || [],
    correct: q.correctIndex ?? q.answer ?? q.correct,
    explanation: q.explanation || q.solution || "",
  }));
}

export default function QuizPage() {
  const { id, testId } = useParams() as { id: string; testId: string };
  const sp = useSearchParams();
  const router = useRouter();
  const name = sp.get("name") || "DPP Quiz";
  const dur = Number(sp.get("dur") || 0);
  const marks = sp.get("marks") || "0";
  const total = sp.get("total") || "0";

  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(dur * 60);

  useEffect(() => {
    (async () => {
      try {
        const d = await getTestDetail(testId, name, id);
        const qs = parseQuestions(d);
        if (qs.length) setQuestions(qs);
      } catch {}
      setLoading(false);
    })();
  }, [testId, name, id]);

  useEffect(() => {
    if (!started || submitted || dur <= 0) return;
    const iv = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [started, submitted, dur]);

  useEffect(() => {
    if (started && !submitted && dur > 0 && timeLeft <= 0) setSubmitted(true);
  }, [timeLeft, started, submitted, dur]);

  const score = useMemo(() => {
    let s = 0;
    questions.forEach((q) => {
      if (answers[q.id] !== undefined && q.correct !== undefined && answers[q.id] === q.correct) s++;
    });
    return s;
  }, [questions, answers]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <VerifyGate>
        <div className="px-4 pt-5 max-w-3xl mx-auto pb-24">
          <div className="shimmer h-8 rounded w-1/2" />
          <div className="shimmer h-40 rounded-3xl mt-5" />
          <div className="shimmer h-12 rounded-full mt-5" />
        </div>
      </VerifyGate>
    );
  }

  if (!started) {
    return (
      <VerifyGate>
        <div className="px-4 pt-5 max-w-3xl mx-auto pb-24">
          <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">DPP Quiz</p>
          <h1 className="text-[28px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{name}</h1>
          <div className="mt-5 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-2 text-sm">
            <p className="text-slate-600 dark:text-slate-300">Total Questions: <b>{total || questions.length}</b></p>
            <p className="text-slate-600 dark:text-slate-300">Total Marks: <b>{marks}</b></p>
            <p className="text-slate-600 dark:text-slate-300">Duration: <b>{dur ? `${dur} Mins` : "No timer"}</b></p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Sahi option select karo, Next dabao. Submit ke baad score aur explanation dikhega.</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-5 w-full py-3.5 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 shadow-[0_3px_0_0_rgba(6,43,95,0.45)] active:scale-95 transition-all"
          >
            Start Quiz
          </button>
          <button onClick={() => router.back()} className="mt-3 w-full py-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200">
            Back
          </button>
        </div>
      </VerifyGate>
    );
  }

  if (submitted) {
    return (
      <VerifyGate>
        <div className="px-4 pt-5 max-w-3xl mx-auto pb-24">
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center text-2xl font-black">
              {questions.length ? Math.round((score / questions.length) * 100) : 0}%
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-4">Quiz Complete!</h1>
            <p className="text-sm text-slate-500 mt-1">
              Score: {score}/{questions.length} • Marks: {marks}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {questions.map((q, i) => {
              const picked = answers[q.id];
              const ok = picked !== undefined && q.correct !== undefined && picked === q.correct;
              return (
                <div key={q.id} className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    Q{i + 1}. {q.question}
                  </p>
                  <p className={`text-xs mt-1 font-bold ${ok ? "text-emerald-600" : "text-red-500"}`}>
                    {ok ? "✓ Sahi jawab" : picked === undefined ? "— Jawab nahi diya" : "✗ Galat jawab"}
                    {q.correct !== undefined && q.options[q.correct] ? ` • Sahi: ${q.options[q.correct]}` : ""}
                  </p>
                  {q.explanation && <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{q.explanation}</p>}
                </div>
              );
            })}
          </div>
          <button onClick={() => router.back()} className="mt-5 w-full py-3.5 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 active:scale-95">
            Back to Chapter
          </button>
        </div>
      </VerifyGate>
    );
  }

  const q = questions[idx];
  return (
    <VerifyGate>
      <div className="px-4 pt-5 max-w-3xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-extrabold tracking-[0.15em] text-blue-600 uppercase">
            Question {questions.length ? idx + 1 : 0}/{questions.length}
          </p>
          {dur > 0 && <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">⏱ {fmt(timeLeft)}</span>}
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-sky-600 transition-all" style={{ width: `${questions.length ? ((idx + 1) / questions.length) * 100 : 0}%` }} />
        </div>

        {q ? (
          <div className="mt-5 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <p className="font-bold text-slate-900 dark:text-white leading-snug">{q.question}</p>
            <div className="mt-4 space-y-2">
              {q.options.map((opt, oi) => {
                const active = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-semibold transition-all active:scale-[0.98] ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-xs font-bold mr-2">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
            Is quiz ke questions abhi load nahi ho rahe. Network check karke dobara try karo.
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex-1 py-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 active:scale-95"
          >
            Previous
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx((i) => i + 1)} className="flex-1 py-3 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-sky-600 active:scale-95">
              Next
            </button>
          ) : (
            <button onClick={() => setSubmitted(true)} className="flex-1 py-3 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 active:scale-95">
              Submit
            </button>
          )}
        </div>
      </div>
    </VerifyGate>
  );
}
