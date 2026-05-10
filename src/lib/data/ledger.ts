import { redirect } from "next/navigation";
import type { CashPayment, Expense, MessMember, Month, Profile } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { canCloseMonth, canManageMembers } from "@/lib/auth/mess";
import { prisma } from "@/lib/db/prisma";
import { currentMonthLabel, nextMonthLabel } from "@/lib/utils";

export type ActiveMembership = MessMember & {
  mess: { id: string; name: string; createdBy: string };
  profile: Profile;
};

export type MemberWithProfile = MessMember & { profile: Profile };

export type LedgerRow = {
  member: MemberWithProfile;
  previousBalance: number;
  monthlyShare: number;
  expensePaid: number;
  cashPaid: number;
  totalContribution: number;
  closingBalance: number;
};

export type Ledger = {
  month: Month;
  members: MemberWithProfile[];
  expenses: Array<Expense & { member: MemberWithProfile | null }>;
  cashPayments: Array<CashPayment & { member: MemberWithProfile }>;
  summaries: LedgerRow[];
  totalExpense: number;
  memberCount: number;
  monthlyShare: number;
  totalDue: number;
  totalAdvance: number;
};

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

export function toDecimal(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "0"));
  if (!Number.isFinite(amount)) return new Prisma.Decimal(0);
  return new Prisma.Decimal(amount);
}

export function parseDate(value: FormDataEntryValue | null) {
  const text = String(value || "");
  const date = text ? new Date(`${text}T00:00:00`) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function formatDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function requireMembership(): Promise<ActiveMembership> {
  const user = await ensureProfile();
  const membership = await prisma.messMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      profile: true,
      mess: {
        select: {
          id: true,
          name: true,
          createdBy: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) redirect("/onboarding");
  return membership;
}

export async function getCurrentOpenMonth(messId: string) {
  const existing = await prisma.month.findFirst({
    where: { messId, status: "OPEN" },
    orderBy: { createdAt: "desc" }
  });

  if (existing) return existing;

  const activeCount = await prisma.messMember.count({
    where: { messId, status: "ACTIVE" }
  });

  return prisma.month.create({
    data: {
      messId,
      label: currentMonthLabel(),
      memberCount: activeCount,
      status: "OPEN"
    }
  });
}

export async function getMessMembers(messId: string) {
  return prisma.messMember.findMany({
    where: { messId },
    include: { profile: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }]
  });
}

export async function getMessMonths(messId: string) {
  return prisma.month.findMany({
    where: { messId },
    orderBy: { createdAt: "desc" }
  });
}

export function endOfDay(value: string) {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function startOfDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getMonthExpenses(messId: string, monthId: string) {
  return prisma.expense.findMany({
    where: { messId, monthId },
    include: { member: { include: { profile: true } } },
    orderBy: { date: "desc" }
  });
}

export async function getMonthCashPayments(messId: string, monthId: string) {
  return prisma.cashPayment.findMany({
    where: { messId, monthId },
    include: { member: { include: { profile: true } } },
    orderBy: { date: "desc" }
  });
}

async function getPreviousBalances(messId: string, members: MemberWithProfile[], before: Date) {
  const balances = new Map<string, number>();
  const previousClosedMonth = await prisma.month.findFirst({
    where: { messId, status: "CLOSED", closedAt: { not: null, lt: before } },
    orderBy: { closedAt: "desc" },
    include: { summaries: true }
  });

  for (const member of members) {
    const saved = previousClosedMonth?.summaries.find((summary) => summary.memberId === member.id);
    balances.set(member.id, saved ? toNumber(saved.closingBalance) : toNumber(member.openingBalance));
  }

  return balances;
}

export async function calculateMonthlyLedger(messId: string, monthId: string): Promise<Ledger> {
  const month = await prisma.month.findUnique({ where: { id: monthId } });
  if (!month || month.messId !== messId) redirect("/dashboard");

  const members = await prisma.messMember.findMany({
    where: { messId, status: "ACTIVE" },
    include: { profile: true },
    orderBy: { createdAt: "asc" }
  });
  const expenses = await getMonthExpenses(messId, monthId);
  const cashPayments = await getMonthCashPayments(messId, monthId);
  const totalExpense = expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const memberCount = members.length;
  const monthlyShare = memberCount ? totalExpense / memberCount : 0;
  const previousBalances = await getPreviousBalances(messId, members, month.createdAt);

  const summaries = members.map((member) => {
    const expensePaid = expenses
      .filter((expense) => expense.memberId === member.id)
      .reduce((sum, expense) => sum + toNumber(expense.amount), 0);
    const cashPaid = cashPayments
      .filter((payment) => payment.memberId === member.id)
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const previousBalance = previousBalances.get(member.id) || 0;
    const totalContribution = expensePaid + cashPaid;
    const closingBalance = previousBalance + monthlyShare - totalContribution;

    return {
      member,
      previousBalance,
      monthlyShare,
      expensePaid,
      cashPaid,
      totalContribution,
      closingBalance
    };
  });

  return {
    month,
    members,
    expenses,
    cashPayments,
    summaries,
    totalExpense,
    memberCount,
    monthlyShare,
    totalDue: summaries.filter((row) => row.closingBalance > 0).reduce((sum, row) => sum + row.closingBalance, 0),
    totalAdvance: summaries.filter((row) => row.closingBalance < 0).reduce((sum, row) => sum + Math.abs(row.closingBalance), 0)
  };
}

export async function getDashboardData() {
  const membership = await requireMembership();
  const month = await getCurrentOpenMonth(membership.messId);
  const ledger = await calculateMonthlyLedger(membership.messId, month.id);
  return { membership, ledger };
}

export function canManageMoney(role: string) {
  return role === "OWNER" || role === "MANAGER";
}

export function canAddExpenseForMember(role: string, actorMemberId: string, memberId: string) {
  return canManageMoney(role) || actorMemberId === memberId;
}

export function assertCanManageMembers(role: string) {
  if (!canManageMembers(role as never)) redirect("/members");
}

export function assertCanCloseMonth(role: string) {
  if (!canCloseMonth(role as never)) redirect("/reports");
}

export async function closeOpenMonth(messId: string, monthId: string) {
  const ledger = await calculateMonthlyLedger(messId, monthId);

  if (ledger.month.status === "CLOSED") return;

  await prisma.$transaction(async (tx) => {
    const current = await tx.month.findUnique({ where: { id: monthId } });
    if (!current || current.status === "CLOSED") return;

    await tx.month.update({
      where: { id: monthId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        memberCount: ledger.memberCount
      }
    });

    await tx.monthlySummary.createMany({
      data: ledger.summaries.map((row) => ({
        messId,
        monthId,
        memberId: row.member.id,
        previousBalance: new Prisma.Decimal(row.previousBalance),
        monthlyShare: new Prisma.Decimal(row.monthlyShare),
        expensePaid: new Prisma.Decimal(row.expensePaid),
        cashPaid: new Prisma.Decimal(row.cashPaid),
        totalContribution: new Prisma.Decimal(row.totalContribution),
        closingBalance: new Prisma.Decimal(row.closingBalance)
      })),
      skipDuplicates: true
    });

    const nextOpen = await tx.month.findFirst({
      where: { messId, status: "OPEN" }
    });

    if (!nextOpen) {
      await tx.month.create({
        data: {
          messId,
          label: nextMonthLabel(current.createdAt),
          memberCount: ledger.memberCount,
          status: "OPEN"
        }
      });
    }
  });
}
