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
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles size={16} /> AI সারাংশ</h2>
        </div>
        <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-300 disabled:cursor-wait disabled:opacity-60">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "তৈরি হচ্ছে..." : summary ? "আবার তৈরি করুন" : "AI সারাংশ দেখুন"}
        </button>
      </div>
      {summary ? <p aria-live="polite" className="mt-5 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-7 text-slate-900 dark:bg-slate-900 dark:text-slate-100">{summary}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
