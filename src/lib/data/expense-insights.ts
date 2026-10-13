import { prisma } from "@/lib/db/prisma";
import { requireMembership } from "@/lib/data/ledger";

export type InsightRow = { label: string; current: number; previous: number; difference: number; percent: number | null };
export type InsightData = {
  currentMonth: string;
  previousMonth: string;
  totalCurrent: number;
  totalPrevious: number;
  expenseCount: number;
  categories: InsightRow[];
  notes: InsightRow[];
  caveat: string;
};

const money = (n: number) => Math.round(n * 100) / 100;

function compare(label: string, current: number, previous: number): InsightRow {
  const difference = money(current - previous);
  return { label, current: money(current), previous: money(previous), difference, percent: previous > 0 ? Math.round((difference / previous) * 100) : null };
}

export async function loadExpenseInsights(): Promise<InsightData> {
  const membership = await requireMembership();
  const today = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", timeZone: "Asia/Dhaka" }).formatToParts(today);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const currentMonth = formatter.format(new Date(Date.UTC(year, month - 1, 15)));
  const previousMonth = formatter.format(new Date(Date.UTC(year, month - 2, 15)));
  // Match accounting period by label, not a single Month id. Prior rollover may have created duplicates.
  const months = await prisma.month.findMany({
    where: { messId: membership.messId, label: { in: [currentMonth, previousMonth] } },
    select: { id: true, label: true },
  });
  const currentIds = months.filter((row) => row.label === currentMonth).map((row) => row.id);
  const previousIds = months.filter((row) => row.label === previousMonth).map((row) => row.id);
  const expenses = await prisma.expense.findMany({
    where: { messId: membership.messId, monthId: { in: [...currentIds, ...previousIds] } },
    select: { monthId: true, category: true, amount: true, note: true },
    take: 10000,
  });
  const currentSet = new Set(currentIds);
  const previousSet = new Set(previousIds);
  const totals = (period: Set<string>, key: (expense: (typeof expenses)[number]) => string | null) => {
    const result = new Map<string, number>();
    for (const expense of expenses) {
      if (!expense.monthId || !period.has(expense.monthId)) continue;
      const label = key(expense);
      if (!label) continue;
      result.set(label, money((result.get(label) ?? 0) + Number(expense.amount)));
    }
    return result;
  };
  const currentCategories = totals(currentSet, (expense) => expense.category);
  const previousCategories = totals(previousSet, (expense) => expense.category);
  // Notes are user-entered free text; exact matching only. Do not pretend synonyms are the same product.
  const normalizeNote = (note: string | null) => {
    const value = note?.trim().replace(/\\s+/g, " ").toLocaleLowerCase();
    return value && value.length >= 2 ? value.slice(0, 80) : null;
  };
  const currentNotes = totals(currentSet, (expense) => normalizeNote(expense.note));
  const previousNotes = totals(previousSet, (expense) => normalizeNote(expense.note));
  const rows = (a: Map<string, number>, b: Map<string, number>) =>
    [...new Set([...a.keys(), ...b.keys()])].map((label) => compare(label, a.get(label) ?? 0, b.get(label) ?? 0))
      .sort((x, y) => y.current - x.current);
  const totalCurrent = money([...currentCategories.values()].reduce((a, b) => a + b, 0));
  const totalPrevious = money([...previousCategories.values()].reduce((a, b) => a + b, 0));
  return {
    currentMonth, previousMonth, totalCurrent, totalPrevious,
    expenseCount: expenses.filter((e) => e.monthId && currentSet.has(e.monthId)).length,
    categories: rows(currentCategories, previousCategories),
    notes: rows(currentNotes, previousNotes).slice(0, 15),
    caveat: "এগুলো মোট খরচের তুলনা, পণ্যের একক বাজারদরের পরিবর্তন নয়। পরিমাণ ও ইউনিট মূল্য সংরক্ষিত না থাকায় দাম বেড়েছে কি না নিশ্চিত বলা যায় না।",
  };
}
