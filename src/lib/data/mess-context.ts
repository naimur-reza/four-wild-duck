import { prisma } from "@/lib/db/prisma";
import { requireMembership } from "@/lib/data/ledger";

export type ExpenseRecord = {
  date: string;
  category: string;
  amount: number;
  note: string | null;
  addedBy: string | null;
};

export type LatestBazarInfo = {
  addedBy: string;
  amount: number;
  date: string;
  note: string | null;
};

export type MemberBazarStat = {
  member: string;
  bazarCount: number;
  totalSpent: number;
};

export type MessContextData = {
  messName: string;
  currentMonth: string;
  members: string[];
  latestBazar: LatestBazarInfo | null;
  topBazarMembers: MemberBazarStat[];
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
 * Includes individual expense records with who added them,
 * plus pre-computed authoritative stats for latest shopping and member rankings.
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
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const memberNames = members.map((m) => m.profile.name);
  const currentMonth = monthLabel(new Date());

  // Find exact most recent BAZAR expense
  const latestBazarExpense = expenses.find((e) => e.category === "BAZAR");
  const latestBazar: LatestBazarInfo | null = latestBazarExpense
    ? {
        addedBy: latestBazarExpense.member?.profile.name || "Unknown",
        amount: money(Number(latestBazarExpense.amount)),
        date: dateLabel(latestBazarExpense.date),
        note: latestBazarExpense.note || "Bazar",
      }
    : null;

  // Compute exact ranking of who did the most bazar shopping
  const bazarExpenses = expenses.filter((e) => e.category === "BAZAR");
  const bazarByMember = new Map<string, { count: number; total: number }>();
  for (const e of bazarExpenses) {
    const name = e.member?.profile.name || "Unknown";
    const curr = bazarByMember.get(name) || { count: 0, total: 0 };
    curr.count += 1;
    curr.total += Number(e.amount);
    bazarByMember.set(name, curr);
  }
  const topBazarMembers: MemberBazarStat[] = [...bazarByMember.entries()]
    .map(([member, stats]) => ({
      member,
      bazarCount: stats.count,
      totalSpent: money(stats.total),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

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
    latestBazar,
    topBazarMembers,
    recentExpenses: records,
    totalExpenses,
    expenseCount: records.length,
  };
}
