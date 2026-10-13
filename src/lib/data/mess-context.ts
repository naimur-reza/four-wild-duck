import { prisma } from "@/lib/db/prisma";
import { requireMembership } from "@/lib/data/ledger";

export type ExpenseRecord = {
  date: string;
  category: string;
  amount: number;
  note: string | null;
  addedBy: string | null;
};

export type MessContextData = {
  messName: string;
  currentMonth: string;
  members: string[];
  recentExpenses: ExpenseRecord[];
  totalExpenses: number;
  expenseCount: number;
};

const money = (n: number) => Math.round(n * 100) / 100;
const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);
const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);

/**
 * Load detailed mess context for answering free-form questions.
 * Includes individual expense records with who added them.
 */
export async function loadMessContext(): Promise<MessContextData> {
  const membership = await requireMembership();
  const messId = membership.messId;

  const [mess, members, expenses] = await Promise.all([
    prisma.mess.findUnique({ where: { id: messId }, select: { name: true } }),
    prisma.messMember.findMany({
      where: { messId, status: "ACTIVE" },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { messId },
      include: { member: { include: { profile: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: 150, // recent expenses for context
    }),
  ]);

  const memberNames = members.map((m) => m.profile.name);
  const currentMonth = monthLabel(new Date());

  const records: ExpenseRecord[] = expenses.map((e) => ({
    date: dateLabel(e.date),
    category: e.category,
    amount: money(Number(e.amount)),
    note: e.note || null,
    addedBy: e.member?.profile.name || null,
  }));

  const totalExpenses = money(records.reduce((sum, r) => sum + r.amount, 0));

  return {
    messName: mess?.name || "Mess",
    currentMonth,
    members: memberNames,
    recentExpenses: records,
    totalExpenses,
    expenseCount: records.length,
  };
}
