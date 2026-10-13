import { NextResponse } from "next/server";
import { loadMessContext } from "@/lib/data/mess-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 503 });

  let question: string;
  try {
    const body = await request.json() as { question?: string };
    question = (body.question || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!question || question.length < 2) {
    return NextResponse.json({ error: "প্রশ্ন লিখুন" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "প্রশ্ন অনেক বড়, ছোট করুন" }, { status: 400 });
  }

  try {
    // Auth and mess isolation are enforced by loadMessContext -> requireMembership.
    const ctx = await loadMessContext();
    if (!ctx.expenseCount) {
      return NextResponse.json({ error: "এই মেসে কোনো expense record পাওয়া যায়নি।" }, { status: 404 });
    }

    const latestBazarText = ctx.latestBazar
      ? `Member: ${ctx.latestBazar.addedBy}, Amount: ${ctx.latestBazar.amount} টাকা, Date: ${ctx.latestBazar.date}, Item: ${ctx.latestBazar.note}`
      : "No bazar recorded";

    const topBazarText = ctx.topBazarMembers.length
      ? ctx.topBazarMembers
          .map((m, i) => `${i + 1}. ${m.member}: ${m.totalSpent} টাকা (${m.bazarCount} বার)`)
          .join(", ")
      : "No data";

    const systemPrompt = `You are a helpful Bangladeshi mess assistant. Answer questions about mess expenses, members, and shopping data in natural Bangla.

CRITICAL AUTHORITATIVE FACTS (ground truth computed from database):
- LATEST BAZAR: ${latestBazarText}
  * If asked "last bajar ke korse", "শেষ বাজার কে করেছে", or similar, the answer is: ${ctx.latestBazar ? ctx.latestBazar.addedBy : "কেউ করেনি"}. State their name, date (${ctx.latestBazar ? ctx.latestBazar.date : ""}), and amount (${ctx.latestBazar ? ctx.latestBazar.amount : 0} টাকা).
- BAZAR RANKING (who shopped the most): ${topBazarText}
  * If asked "ke beshi bajar korse" or "কার বাজার সবচেয়ে বেশি", use this ranking.

CONTEXT:
- Mess name: ${ctx.messName}
- Members: ${ctx.members.join(", ")}
- Current month: ${ctx.currentMonth}
- Total expense amount: ${ctx.totalExpenses} টাকা

RULES:
- Answer in Bangla, friendly and conversational
- Keep answers direct and concise (1-3 sentences)
- Use bold with **word** for important names and amounts so they stand out
- Numbers should be written cleanly: e.g. "690 টাকা"
- Only state facts supported by the data above
- If you can't answer from the data, say so politely`;

    const candidateModels = [
      process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
    ];

    let answer = "";
    let lastError = "";
    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            temperature: 0.25,
            max_tokens: 1024,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Question: ${question}\n\nRecent expenses:\n${JSON.stringify(ctx.recentExpenses.slice(0, 80))}` },
            ],
          }),
          cache: "no-store",
        });
        clearTimeout(timeout);
        if (response.ok) {
          const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          answer = result.choices?.[0]?.message?.content?.trim() || "";
          if (answer) break;
        } else {
          const errBody = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
          lastError = errBody?.error?.message || `Groq error (${response.status})`;
          console.error(`Groq error for ${model}:`, response.status, lastError);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Request timed out";
        console.error(`Groq fetch error for ${model}:`, err);
      }
    }

    if (!answer) {
      return NextResponse.json({ error: lastError || "AI উত্তর দিতে পারছে না, আবার চেষ্টা করুন" }, { status: 502 });
    }

    return NextResponse.json({ answer: answer.slice(0, 4000) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "উত্তর তৈরি করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
