import { prisma } from "@/lib/db/prisma";
import { requireMembership } from "@/lib/data/ledger";

export type InsightRow = { label: string; current: number; previous: number; difference: number; percent: number | null };
export type InsightData = {
  currentMonth: string;
  previousMonth: string;
  totalCurrent: number;
  totalPrevious: number;
  expenseCount: number;
  historicalCount: number;
  categories: InsightRow[];
  notes: InsightRow[];
};

const money = (n: number) => Math.round(n * 100) / 100;
const monthLabel = (date: Date) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);
const compare = (label: string, current: number, previous: number): InsightRow => {
  const difference = money(current - previous);
  return { label, current: money(current), previous: money(previous), difference, percent: previous > 0 ? Math.round(difference / previous * 100) : null };
};

export async function loadExpenseInsights(): Promise<InsightData> {
  const membership = await requireMembership();
  const [months, expenses] = await Promise.all([
    prisma.month.findMany({ where: { messId: membership.messId }, select: { id: true, label: true } }),
    prisma.expense.findMany({
      where: { messId: membership.messId },
      select: { id: true, monthId: true, date: true, category: true, amount: true, note: true },
      orderBy: { date: "desc" },
    }),
  ]);
  const labels = new Map(months.map((month) => [month.id, month.label]));
  // The date is authoritative for expense reporting. Older imports may have
  // missing/stale month links; use the linked month only when dates are invalid.
  const grouped = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const label = monthLabel(expense.date) || (expense.monthId ? labels.get(expense.monthId) : undefined);
    if (!label) continue;
    const group = grouped.get(label) ?? [];
    group.push(expense);
    grouped.set(label, group);
  }
  const currentCalendar = monthLabel(new Date());
  const periods = [...grouped.keys()].sort((a, b) => Date.parse("1 " + b) - Date.parse("1 " + a));
  // If this calendar month has no records, show the latest month with actual data,
  // rather than incorrectly claiming there have never been expenses.
  const currentMonth = grouped.has(currentCalendar) ? currentCalendar : periods[0] ?? currentCalendar;
  const previousMonth = monthLabel(new Date(Date.UTC(
    new Date("1 " + currentMonth).getUTCFullYear(),
    new Date("1 " + currentMonth).getUTCMonth() - 1, 15
  )));
  const current = grouped.get(currentMonth) ?? [];
  const previous = grouped.get(previousMonth) ?? [];
  const total = (rows: typeof expenses) => money(rows.reduce((sum, row) => sum + Number(row.amount), 0));
  const rollup = (rows: typeof expenses, key: (expense: typeof expenses[number]) => string | null) => {
    const totals = new Map<string, number>();
    for (const expense of rows) {
      const label = key(expense);
      if (label) totals.set(label, money((totals.get(label) ?? 0) + Number(expense.amount)));
    }
    return totals;
  };
  const rows = (key: (expense: typeof expenses[number]) => string | null) => {
    const a = rollup(current, key);
    const b = rollup(previous, key);
    return [...new Set([...a.keys(), ...b.keys()])]
      .map((label) => compare(label, a.get(label) ?? 0, b.get(label) ?? 0))
      .sort((x, y) => y.current - x.current);
  };
  return {
    currentMonth, previousMonth,
    totalCurrent: total(current), totalPrevious: total(previous),
    expenseCount: current.length, historicalCount: expenses.length,
    categories: rows((expense) => expense.category),
    notes: rows((expense) => expense.note?.trim().replace(/\s+/g, " ").toLocaleLowerCase().slice(0, 80) || null).slice(0, 20),
  };
}
