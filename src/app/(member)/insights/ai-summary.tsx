"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

export function BanglaAiSummary() {
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function generate() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/insights/summary", { method: "POST", credentials: "same-origin" });
      const data = await response.json() as { summary?: string; error?: string };
      if (!response.ok || !data.summary) throw new Error(data.error || "সারাংশ তৈরি করা যায়নি");
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="rounded-2xl border border-teal-500/30 bg-teal-950 p-5 text-white shadow-lg sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300"><Sparkles size={16} /> Groq AI</p>
          <h2 className="mt-1 text-xl font-black">বাংলায় মাসের খরচের গল্প</h2>
        </div>
        <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-300 disabled:cursor-wait disabled:opacity-60">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "তৈরি হচ্ছে..." : summary ? "আবার তৈরি করুন" : "AI সারাংশ দেখুন"}
        </button>
      </div>
      {summary ? <p aria-live="polite" className="mt-5 whitespace-pre-line rounded-xl bg-white/10 p-4 text-sm leading-8 text-white">{summary}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}
