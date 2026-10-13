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
  // Use both the linked accounting month and the expense date, matching the Expenses page.
  // Load all mess-scoped records so historic expenses are not silently reported as zero.
  const [months, expenses] = await Promise.all([
    prisma.month.findMany({ where: { messId: membership.messId }, select: { id: true, label: true } }),
    prisma.expense.findMany({
      where: { messId: membership.messId },
      select: { monthId: true, date: true, category: true, amount: true, note: true },
      orderBy: { date: "desc" },
    }),
  ]);
  const labelById = new Map(months.map((row) => [row.id, row.label]));
  const periodLabel = (date: Date) => formatter.format(date);
  const periodStart = (label: string) => {
    const match = /^(\\w+) (\\d{4})$/.exec(label);
    if (!match) return null;
    const index = new Date(`${match[1]} 1, 2000`).getUTCMonth();
    if (Number.isNaN(index)) return null;
    return Date.UTC(Number(match[2]), index, 1) - 6 * 60 * 60 * 1000;
  };
  const belongsTo = (expense: (typeof expenses)[number], label: string) => {
    const start = periodStart(label);
    const dateMatches = start !== null && expense.date.getTime() >= start &&
      expense.date.getTime() < new Date(start + 6 * 60 * 60 * 1000).setUTCMonth
        ? false : false;
    return dateMatches;
  };
  const inPeriod = (expense: (typeof expenses)[number], label: string) => {
    const start = periodStart(label);
    if (start === null) return labelById.get(expense.monthId ?? "") === label;
    const parsed = /^(\\w+) (\\d{4})$/.exec(label)!;
    const monthIndex = new Date(`${parsed[1]} 1, 2000`).getUTCMonth();
    const end = Date.UTC(Number(parsed[2]), monthIndex + 1, 1) - 6 * 60 * 60 * 1000;
    return labelById.get(expense.monthId ?? "") === label ||
      (expense.date.getTime() >= start && expense.date.getTime() < end);
  };
  // If this and last month have no entries, show the most recent populated period instead.
  // Never fabricate spending for an empty calendar month.
  const populated = [...new Set(expenses.map((e) => labelById.get(e.monthId ?? "") || periodLabel(e.date)))];
  const selectedCurrent = expenses.some((e) => inPeriod(e, currentMonth) || inPeriod(e, previousMonth))
    ? currentMonth : populated[0] || currentMonth;
  const selectedDate = new Date(`${selectedCurrent} 15, 2020`);
  const parsed = /^(\\w+) (\\d{4})$/.exec(selectedCurrent);
  const selectedPrevious = parsed
    ? formatter.format(new Date(Date.UTC(Number(parsed[2]), new Date(`${parsed[1]} 1, 2000`).getUTCMonth() - 1, 15)))
    : previousMonth;
  const totals = (period: string, key: (expense: (typeof expenses)[number]) => string | null) => {
    const result = new Map<string, number>();
    for (const expense of expenses) {
      if (!inPeriod(expense, period)) continue;
      const label = key(expense);
      if (!label) continue;
      result.set(label, money((result.get(label) ?? 0) + Number(expense.amount)));
    }
    return result;
  };
  const currentCategories = totals(selectedCurrent, (expense) => expense.category);
  const previousCategories = totals(selectedPrevious, (expense) => expense.category);
  // Notes are user-entered free text; exact matching only. Do not pretend synonyms are the same product.
  const normalizeNote = (note: string | null) => {
    const value = note?.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    return value && value.length >= 2 ? value.slice(0, 80) : null;
  };
  const currentNotes = totals(selectedCurrent, (expense) => normalizeNote(expense.note));
  const previousNotes = totals(selectedPrevious, (expense) => normalizeNote(expense.note));
  const rows = (a: Map<string, number>, b: Map<string, number>) =>
    [...new Set([...a.keys(), ...b.keys()])].map((label) => compare(label, a.get(label) ?? 0, b.get(label) ?? 0))
      .sort((x, y) => y.current - x.current);
  const totalCurrent = money([...currentCategories.values()].reduce((a, b) => a + b, 0));
  const totalPrevious = money([...previousCategories.values()].reduce((a, b) => a + b, 0));
  return {
    currentMonth: selectedCurrent, previousMonth: selectedPrevious, totalCurrent, totalPrevious,
    expenseCount: expenses.filter((e) => inPeriod(e, selectedCurrent)).length,
    categories: rows(currentCategories, previousCategories),
    notes: rows(currentNotes, previousNotes).slice(0, 15),
    caveat: "এগুলো মোট খরচের তুলনা, পণ্যের একক বাজারদরের পরিবর্তন নয়। পরিমাণ ও ইউনিট মূল্য সংরক্ষিত না থাকায় দাম বেড়েছে কি না নিশ্চিত বলা যায় না।",
  };
}
