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

    const systemPrompt = `You are a helpful Bangladeshi mess assistant. Answer questions about the mess expenses, members, and shopping data in natural Bangla.

CONTEXT:
- Mess name: ${ctx.messName}
- Members: ${ctx.members.join(", ")}
- Current month: ${ctx.currentMonth}
- Total ${ctx.expenseCount} expense records loaded

DATA:
The "expenses" array contains recent expense records. Each record has:
- date: when the expense was made
- category: expense type (BAZAR, RENT, ELECTRICITY, GAS, INTERNET, OTHER)
- amount: amount in taka
- note: what was bought (item name/description)
- addedBy: which member added/did this expense (this is who did the shopping/bajar)

RULES:
- Answer in Bangla, friendly and conversational
- Use bullet points with "• " prefix for lists
- Use "▸ " prefix for section headers if needed
- Numbers should be clear: write amounts like "5,250 টাকা"
- Only use data from the provided records — do NOT invent or guess
- If you can't answer from the data, say so honestly
- Keep answers concise and relevant
- No markdown formatting (no **, no ##)
- "addedBy" = who did the bajar/shopping/paid for the expense
- For "ke bajar korse" type questions, look at addedBy field in BAZAR category expenses
- For "ke beshi bajar korse", count or sum amounts grouped by addedBy
- For "last bajar ke korse", find the most recent BAZAR expense and check addedBy`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          temperature: 0.3,
          max_completion_tokens: 1800,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Expense data:\n${JSON.stringify(ctx.recentExpenses)}\n\nQuestion: ${question}` },
          ],
        }),
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json({ error: "AI উত্তর দিতে পারছে না, আবার চেষ্টা করুন" }, { status: 502 });
    }

    const result = await response.json() as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }> };
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "AI কোনো উত্তর দেয়নি। আবার চেষ্টা করুন।" }, { status: 502 });
    }

    return NextResponse.json({ answer: answer.slice(0, 4000) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "উত্তর তৈরি করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
