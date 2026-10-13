"use client";

import { useState, useRef, type FormEvent } from "react";
import { Sparkles, Send, MessageCircleQuestion } from "lucide-react";

/** Render an inline segment with clear tabular numbers */
function renderInline(segment: string, keyPrefix: string): React.ReactNode {
  const parts = segment.split(/([\d০-৯,]+(?:\.[\d০-৯]+)?(?:\s*টাকা)?|৳[\d০-৯,]+(?:\.[\d০-৯]+)?)/g);
  return parts.map((part, i) =>
    /[\d০-৯]/.test(part) ? (
      <span
        key={`${keyPrefix}-${i}`}
        className="font-bold tabular-nums"
        style={{
          fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        {part}
      </span>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

/** Format a text line: parses markdown bold (**...**), italic (*...*), and clear numbers */
function formatLine(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      const inner = token.slice(2, -2);
      return (
        <strong key={i} className="font-black text-slate-950">
          {renderInline(inner, `bold-${i}`)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <em key={i} className="italic font-medium">
          {renderInline(inner, `em-${i}`)}
        </em>
      );
    }
    return <span key={i}>{renderInline(token, `txt-${i}`)}</span>;
  });
}

function FormattedContent({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Overview line (starts with 📊)
    if (line.startsWith("📊")) {
      elements.push(
        <div key={i} className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
          {formatLine(line)}
        </div>
      );
    }
    // Section header (starts with ▸)
    else if (line.startsWith("▸")) {
      elements.push(
        <h3 key={i} className="mb-2 mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-teal-700 first:mt-0">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="shrink-0">{line.replace("▸", "").trim()}</span>
          <span className="h-px flex-1 bg-slate-200" />
        </h3>
      );
    }
    // Bullet point (starts with •)
    else if (line.startsWith("•")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-1 text-sm leading-6 text-slate-700">
          <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
          <span>{formatLine(line.replace("•", "").trim())}</span>
        </div>
      );
    }
    // Any other text
    else {
      elements.push(
        <p key={i} className="py-1 text-sm leading-6 text-slate-600">
          {formatLine(line)}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}

// --- Chat message type ---
type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

// --- Ask AI Section ---
function AskAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    "শেষ বাজার কে করেছে?",
    "কে বেশি বাজার করেছে?",
    "এই মাসে সবজিতে কত খরচ?",
    "সবচেয়ে বেশি খরচ কোন খাতে?",
  ];

  async function handleAsk(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/insights/ask", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !data.answer) {
        throw new Error(data.error || "উত্তর পাওয়া যায়নি");
      }
      setMessages((prev) => [...prev, { role: "ai", text: data.answer! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleAsk(question);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <MessageCircleQuestion size={18} className="text-teal-700" />
        <h2 className="text-sm font-bold text-slate-800">AI কে জিজ্ঞাসা করুন</h2>
      </div>

      {/* Suggestions when no messages */}
      {messages.length === 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleAsk(s)}
              disabled={loading}
              className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-teal-700 text-white"
                    : "border border-slate-100 bg-slate-50 text-slate-700"
                }`}
              >
                {msg.role === "ai" ? <FormattedContent text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p role="alert" className="mb-3 text-xs text-rose-600">{error}</p>}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="যেকোনো প্রশ্ন করুন... (যেমন: শেষ বাজার কে করেছে?)"
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white transition hover:bg-teal-800 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// --- Summary Section ---
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
      if (!response.ok || !data.summary) throw new Error(data.error || "সারাংশ তৈরি করা যায়নি");
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          <Sparkles size={16} />{loading ? "তৈরি হচ্ছে..." : summary ? "আবার দেখুন" : "AI সারাংশ"}
        </button>
        {summary ? <div className="mt-4"><FormattedContent text={summary} /></div> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
      <AskAiChat />
    </>
  );
}
