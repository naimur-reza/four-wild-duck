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
    const candidateModels = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
    ];

    let summary = "";
    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 14000);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            temperature: 0.25,
            max_completion_tokens: 2400,
            messages: [
              { role: "system", content: `You are a careful Bangladeshi mess expense analyst. Write a clear, structured Bangla summary as a bullet-point list so mess members can quickly scan and understand every cost.

FORMAT RULES (strictly follow):
- Start with a one-line overview: "📊 [current month] মাসের সারাংশ"
- Then use bullet points with "• " prefix for each item (NOT numbered lists, NOT markdown bullets)
- Group into these sections with headers using "▸ " prefix:

▸ খরচের হিসাব
• মোট খরচ: [amount] টাকা
• আগের মাসে ছিল: [amount] টাকা
• পার্থক্য: [+/- amount] টাকা

▸ কিসে কত খরচ (আইটেম অনুযায়ী)
Use the "notes" array from the data — these are individual expense titles (e.g. চাল, ডাল, তেল, গ্যাস, সবজি).
List ALL items from the notes array with their amounts:
• [item title]: [amount] টাকা
(list every item from notes that has a current amount > 0, sorted by amount descending)

▸ ক্যাটাগরি অনুযায়ী
• [category]: [amount] টাকা
(list categories briefly)

▸ মাসের তুলনা
• [any notable increase/decrease between months, if data supports]
• If an item appeared this month but not last month, mention it
• If an item's total went up or down significantly, mention it

▸ পরামর্শ
• [one practical, gentle suggestion based on the spending pattern]

CONTENT RULES:
- The "notes" field contains expense titles (what was actually bought) — this is the PRIMARY data source for the summary
- The "categories" field is secondary grouping — mention briefly
- Use only the JSON numbers provided
- Write amounts with Bangla text, e.g. "৫,২৫০ টাকা" or "5,250 টাকা"
- Clearly distinguish total spending from unit prices: NEVER claim a product price increased without quantity and unit-price data
- Do not invent causes, figures, transactions, people, recommendations involving specific products not in the data, or market trends
- If prior month total is zero, skip comparison section
- Keep each bullet point to one line, concise and direct` },
              { role: "user", content: JSON.stringify(payload) },
            ],
          }),
          cache: "no-store",
        });
        clearTimeout(timeout);
        if (response.ok) {
          const result = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }> };
          summary = result.choices?.[0]?.message?.content?.trim() || "";
          if (summary) break;
        }
      } catch {
        // Fallback to next model
      }
    }

    if (!summary) {
      return NextResponse.json({ error: "AI সারাংশ তৈরি করতে পারছে না। আবার চেষ্টা করুন।" }, { status: 502 });
    }
    return NextResponse.json({ summary: summary.slice(0, 4000) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not generate the summary right now" }, { status: 500 });
  }
}
