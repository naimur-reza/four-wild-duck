"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

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
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
        <Sparkles size={16} />{loading ? "তৈরি হচ্ছে..." : summary ? "আবার দেখুন" : "AI সারাংশ"}
      </button>
      {summary ? <p aria-live="polite" className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{summary}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
