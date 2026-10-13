import { NextResponse } from "next/server";
import { loadExpenseInsights } from "@/lib/data/expense-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 503 });
  try {
    // Auth and mess isolation are enforced by loadExpenseInsights -> requireMembership.
    const data = await loadExpenseInsights();
    if (!data.expenseCount) return NextResponse.json({ error: "এই মেসে কোনো expense record পাওয়া যায়নি।" }, { status: 404 });
    const payload = {
      currentMonth: data.currentMonth,
      previousMonth: data.previousMonth,
      totalCurrent: data.totalCurrent,
      totalPrevious: data.totalPrevious,
      expenseCount: data.expenseCount,
      categories: data.categories,
      notes: data.notes,
      caveat: "Spending changes do not establish unit price changes.",
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          temperature: 0.25,
          max_completion_tokens: 1800,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: "You are a careful Bangladeshi mess expense analyst. Write 3-5 short, natural Bangla sentences, friendly and helpful for all mess members. Use only the JSON numbers provided. Mention biggest category and important month-over-month differences if supported. Clearly distinguish total spending from unit prices: NEVER claim a product price increased without quantity and unit-price data. Do not invent causes, figures, transactions, people, recommendations involving specific products not in the data, or market trends. No markdown table. Currency is Bangladeshi taka. If prior month is zero, do not calculate growth percent. End with a gentle practical suggestion." },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return NextResponse.json({ error: "AI summary is temporarily unavailable" }, { status: 502 });
    const result = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }> };
    const summary = result.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      const finish = result.choices?.[0]?.finish_reason;
      return NextResponse.json({ error: finish === "length" ? "AI উত্তর শেষ করতে পারেনি। আবার চেষ্টা করুন।" : "AI কোনো লেখা ফেরত দেয়নি। আবার চেষ্টা করুন।" }, { status: 502 });
    }
    return NextResponse.json({ summary: summary.slice(0, 2500) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not generate the summary right now" }, { status: 500 });
  }
}
