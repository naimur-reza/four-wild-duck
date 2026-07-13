"use server";

import { revalidatePath, refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { ExpenseCategory, MemberStatus, MessRole } from "@/generated/prisma/client";
import {
  assertCanCloseMonth,
  assertCanManageMembers,
  canAddExpenseForMember,
  canManageMoney,
  closeOpenMonth,
  getCurrentOpenMonth,
  getMonthEndFromLabel,
  parseDate,
  requireMembership,
  toDecimal
} from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { notifyMessMembers } from "@/lib/notifications/web-push";
import { formatTaka } from "@/lib/utils";

const categories: ExpenseCategory[] = ["RENT", "BAZAR", "ELECTRICITY", "GAS", "INTERNET", "OTHER"];
const roles: MessRole[] = ["OWNER", "MANAGER", "MEMBER"];
const statuses: MemberStatus[] = ["ACTIVE", "INACTIVE"];

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getRole(value: string): MessRole {
  return roles.includes(value as MessRole) ? (value as MessRole) : "MEMBER";
}

function getStatus(value: string): MemberStatus {
  return statuses.includes(value as MemberStatus) ? (value as MemberStatus) : "ACTIVE";
}

function getCategory(value: string): ExpenseCategory {
  return categories.includes(value as ExpenseCategory) ? (value as ExpenseCategory) : "OTHER";
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function makeInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

async function getOrCreateInviteCode(messId: string) {
  const mess = await prisma.mess.findUnique({
    where: { id: messId },
    select: { inviteCode: true }
  });

  if (mess?.inviteCode) return mess.inviteCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = makeInviteCode();

    try {
      await prisma.mess.update({
        where: { id: messId },
        data: { inviteCode }
      });
      return inviteCode;
    } catch {
      // Retry if a random code somehow collides.
    }
  }

  throw new Error("Could not generate invite link. Please try again.");
}

function revalidateMoneyViews() {
  revalidatePath("/expenses");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/history");
}

function refreshMoneyViews() {
  revalidateMoneyViews();
  refresh();
}

export async function addMember(formData: FormData) {
  const membership = await requireMembership();
  assertCanManageMembers(membership.role);

  const query = text(formData, "profile").toLowerCase();
  const requestedRole = getRole(text(formData, "role"));
  const role = membership.role === "OWNER" ? requestedRole : "MEMBER";
  const openingBalance = toDecimal(formData.get("opening_balance"));

  if (!query) redirect("/members?memberStatus=missing-query");

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { userId: query },
        { email: { equals: query, mode: "insensitive" } },
        { username: { equals: query, mode: "insensitive" } }
      ]
    }
  });

  if (!profile) {
    if (!looksLikeEmail(query)) redirect("/members?memberStatus=profile-not-found");

    await prisma.memberInvite.upsert({
      where: {
        messId_email: {
          messId: membership.messId,
          email: query
        }
      },
      update: {
        role,
        openingBalance,
        invitedBy: membership.userId,
        acceptedAt: null
      },
      create: {
        messId: membership.messId,
        email: query,
        role,
        openingBalance,
        invitedBy: membership.userId
      }
    });

    revalidatePath("/members");
    redirect("/members?memberStatus=invite-created");
  }

  const alreadyJoined = await prisma.messMember.findUnique({
    where: {
      messId_userId: {
        messId: membership.messId,
        userId: profile.userId
      }
    }
  });

  if (alreadyJoined) redirect("/members?memberStatus=already-member");

  await prisma.messMember.create({
    data: {
      messId: membership.messId,
      userId: profile.userId,
      role,
      openingBalance,
      status: "ACTIVE"
    }
  });

  await prisma.memberInvite.updateMany({
    where: {
      messId: membership.messId,
      email: profile.email?.toLowerCase() || query,
      acceptedAt: null
    },
    data: { acceptedAt: new Date() }
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");
  redirect("/members?memberStatus=member-added");
}

export async function updateMember(formData: FormData) {
  const membership = await requireMembership();
  assertCanManageMembers(membership.role);

  const memberId = text(formData, "member_id");
  if (!memberId) return;

  const target = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId }
  });

  if (!target) return;

  const status = getStatus(text(formData, "status"));
  const nextRole = getRole(text(formData, "role"));
  const data: { status: MemberStatus; role?: MessRole } = { status };

  if (membership.role === "OWNER" && target.role !== "OWNER") {
    data.role = nextRole === "OWNER" ? "MANAGER" : nextRole;
  }

  await prisma.messMember.update({ where: { id: memberId }, data });

  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function transferOwnership(formData: FormData) {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") redirect("/settings?ownershipStatus=owner-only");

  const targetMemberId = text(formData, "target_member_id");
  if (!targetMemberId || targetMemberId === membership.id) redirect("/settings?ownershipStatus=invalid-target");

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.messMember.findFirst({
      where: { id: targetMemberId, messId: membership.messId, status: "ACTIVE" },
      select: { id: true, userId: true, profile: { select: { name: true } } }
    });

    if (!target) return "invalid-target" as const;

    await tx.messMember.update({
      where: { id: target.id },
      data: { role: "OWNER" }
    });

    await tx.messMember.update({
      where: { id: membership.id },
      data: { role: "MANAGER" }
    });

    return "transferred" as const;
  });

  revalidatePath("/settings");
  revalidatePath("/members");
  revalidatePath("/dashboard");

  redirect(`/settings?ownershipStatus=${result}`);
}

export async function updateOpeningBalance(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) redirect("/settings");

  const memberId = text(formData, "member_id");
  if (!memberId) return;

  const target = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId },
    select: { id: true }
  });

  if (!target) return;

  await prisma.messMember.update({
    where: { id: memberId },
    data: { openingBalance: toDecimal(formData.get("opening_balance")) }
  });

  revalidateMoneyViews();
  revalidatePath("/settings");
  refresh();
}

export async function updateProfileName(formData: FormData) {
  const membership = await requireMembership();
  const name = text(formData, "name");

  if (name.length < 2) redirect("/settings?profileStatus=name-too-short");
  if (name.length > 60) redirect("/settings?profileStatus=name-too-long");

  await prisma.profile.update({
    where: { userId: membership.userId },
    data: { name }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  refresh();
}

export async function addExpense(formData: FormData) {
  const membership = await requireMembership();
  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id") || membership.id;

  if (month.status !== "OPEN") return;
  if (!canAddExpenseForMember(membership.role, membership.id, memberId)) return;

  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId, status: "ACTIVE" },
    include: { profile: true }
  });
  if (!member) return;

  const amount = toDecimal(formData.get("amount"));
  const note = text(formData, "note") || null;
  const category = getCategory(text(formData, "category"));

  await prisma.$transaction(async (tx) => {
    await tx.expense.create({
      data: {
        messId: membership.messId,
        monthId: month.id,
        memberId,
        category,
        amount,
        date: parseDate(formData.get("date")),
        note
      }
    });
  });

  await notifyMessMembers({
    messId: membership.messId,
    actorUserId: membership.userId,
    payload: {
      title: "New expense added",
      body: `${member.profile.name} added ${formatTaka(Number(amount))}${note ? ` for ${note}` : ` in ${category}`}.`,
      url: "/expenses"
    }
  });

  refreshMoneyViews();
}

export async function updateExpense(formData: FormData) {
  const membership = await requireMembership();
  const expenseId = text(formData, "expense_id");
  const memberId = text(formData, "member_id") || membership.id;
  if (!expenseId) return;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findFirst({
      where: { id: expenseId, messId: membership.messId },
      include: { month: { select: { status: true } } }
    });
    if (!expense || expense.month?.status !== "OPEN") return;
    if (!canAddExpenseForMember(membership.role, membership.id, expense.memberId || "")) return;
    if (!canAddExpenseForMember(membership.role, membership.id, memberId)) return;

    const member = await tx.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } });
    if (!member) return;

    await tx.expense.update({
      where: { id: expenseId },
      data: {
        memberId,
        category: getCategory(text(formData, "category")),
        amount: toDecimal(formData.get("amount")),
        date: parseDate(formData.get("date")),
        note: text(formData, "note") || null
      }
    });
  });

  refreshMoneyViews();
}

export async function deleteExpense(formData: FormData) {
  const membership = await requireMembership();
  const expenseId = text(formData, "expense_id");
  if (!expenseId) return;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findFirst({
      where: { id: expenseId, messId: membership.messId },
      include: { month: { select: { status: true } } }
    });
    if (!expense || expense.month?.status !== "OPEN") return;
    if (!canAddExpenseForMember(membership.role, membership.id, expense.memberId || "")) return;

    await tx.expense.delete({ where: { id: expenseId } });
  });

  refreshMoneyViews();
}

export async function addPayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id");
  if (month.status !== "OPEN") return;

  const member = await prisma.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } });

  if (!member) return;

  await prisma.$transaction(async (tx) => {
    await tx.cashPayment.create({
      data: {
        messId: membership.messId,
        monthId: month.id,
        memberId,
        amount: toDecimal(formData.get("amount")),
        date: parseDate(formData.get("date")),
        note: text(formData, "note") || null
      }
    });
  });

  refreshMoneyViews();
}

export async function updatePayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const paymentId = text(formData, "payment_id");
  const memberId = text(formData, "member_id");
  if (!paymentId || !memberId) return;

  await prisma.$transaction(async (tx) => {
    const [payment, member] = await Promise.all([
      tx.cashPayment.findFirst({
        where: { id: paymentId, messId: membership.messId },
        include: { month: { select: { status: true } } }
      }),
      tx.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } })
    ]);

    if (!payment || payment.month?.status !== "OPEN" || !member) return;

    await tx.cashPayment.update({
      where: { id: paymentId },
      data: {
        memberId,
        amount: toDecimal(formData.get("amount")),
        date: parseDate(formData.get("date")),
        note: text(formData, "note") || null
      }
    });
  });

  refreshMoneyViews();
}

export async function deletePayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const paymentId = text(formData, "payment_id");
  if (!paymentId) return;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.cashPayment.findFirst({
      where: { id: paymentId, messId: membership.messId },
      include: { month: { select: { status: true } } }
    });
    if (!payment || payment.month?.status !== "OPEN") return;

    await tx.cashPayment.delete({ where: { id: paymentId } });
  });

  refreshMoneyViews();
}

export async function closeMonth() {
  const membership = await requireMembership();
  assertCanCloseMonth(membership.role);
  const month = await getCurrentOpenMonth(membership.messId);

  await closeOpenMonth(membership.messId, month.id);

  await notifyMessMembers({
    messId: membership.messId,
    actorUserId: membership.userId,
    payload: {
      title: "Month closed",
      body: `${month.label} has been closed. Check the final report and carried balances.`,
      url: "/reports"
    }
  });

  refreshMoneyViews();
}

export async function reopenMonth(formData: FormData) {
  const membership = await requireMembership();
  assertCanCloseMonth(membership.role);

  const monthId = text(formData, "month_id");
  if (!monthId) redirect("/history?reopenStatus=missing-month");

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.month.findFirst({
      where: { id: monthId, messId: membership.messId, status: "CLOSED" }
    });

    if (!target) return "not-found" as const;

    const latestClosed = await tx.month.findFirst({
      where: { messId: membership.messId, status: "CLOSED" },
      orderBy: { closedAt: "desc" },
      select: { id: true }
    });

    if (latestClosed?.id !== target.id) return "not-latest" as const;

    const openMonth = await tx.month.findFirst({
      where: { messId: membership.messId, status: "OPEN" },
      select: { id: true }
    });

    if (openMonth) {
      const [expenseCount, paymentCount] = await Promise.all([
        tx.expense.count({ where: { messId: membership.messId, monthId: openMonth.id } }),
        tx.cashPayment.count({ where: { messId: membership.messId, monthId: openMonth.id } })
      ]);

      if (expenseCount > 0 || paymentCount > 0) return "open-has-activity" as const;

      await tx.monthlySummary.deleteMany({ where: { messId: membership.messId, monthId: openMonth.id } });
      await tx.month.delete({ where: { id: openMonth.id } });
    }

    await tx.monthlySummary.deleteMany({ where: { messId: membership.messId, monthId: target.id } });
    await tx.month.update({
      where: { id: target.id },
      data: {
        status: "OPEN",
        closedAt: null
      }
    });

    return "reopened" as const;
  });

  revalidateMoneyViews();

  if (result === "reopened") redirect("/reports?reopenStatus=reopened");
  redirect(`/history?month=${monthId}&reopenStatus=${result}`);
}

export async function regenerateInviteLink() {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") return;

  await prisma.mess.update({
    where: { id: membership.messId },
    data: { inviteCode: makeInviteCode() }
  });

  revalidatePath("/settings");
  refresh();
}

export async function ensureInviteLink() {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") return;

  await getOrCreateInviteCode(membership.messId);
  revalidatePath("/settings");
  refresh();
}

export async function leaveMess() {
  const membership = await requireMembership();

  const result = await prisma.$transaction(async (tx) => {
    const activeMembers = await tx.messMember.findMany({
      where: { messId: membership.messId, status: "ACTIVE" },
      select: { id: true, role: true }
    });

    const isOnlyActiveMember = activeMembers.length === 1;
    const otherOwners = activeMembers.filter((member) => member.role === "OWNER" && member.id !== membership.id);

    if (membership.role === "OWNER" && otherOwners.length === 0 && !isOnlyActiveMember) {
      return "owner-needs-transfer" as const;
    }

    await tx.pushSubscription.deleteMany({
      where: {
        messId: membership.messId,
        userId: membership.userId
      }
    });

    if (isOnlyActiveMember) {
      await tx.mess.delete({ where: { id: membership.messId } });
      return "deleted-empty-mess" as const;
    }

    await tx.messMember.update({
      where: { id: membership.id },
      data: { status: "INACTIVE" }
    });

    return "left" as const;
  });

  if (result === "owner-needs-transfer") redirect("/settings?leaveStatus=owner-needs-transfer");
  redirect("/onboarding?leaveStatus=left");
}

export async function renameMess(formData: FormData) {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") return;

  const name = text(formData, "name");
  if (!name) return;

  await prisma.mess.update({ where: { id: membership.messId }, data: { name } });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateAutoCloseSettings(formData: FormData) {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") return;

  const autoCloseEnabled = text(formData, "auto_close_enabled") === "true";
  const gracePeriod = Math.max(0, Math.min(90, Number(text(formData, "grace_period")) || 3));

  await prisma.mess.update({
    where: { id: membership.messId },
    data: {
      autoCloseEnabled,
      closeGracePeriodDays: gracePeriod,
    },
  });

  revalidatePath("/settings");
  refresh();
}

export async function closeOverdueMonths() {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") redirect("/settings");

  const mess = await prisma.mess.findUnique({
    where: { id: membership.messId },
    select: { autoCloseEnabled: true, closeGracePeriodDays: true },
  });
  if (!mess || !mess.autoCloseEnabled) redirect("/settings");

  const openMonths = await prisma.month.findMany({
    where: { messId: membership.messId, status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });

  const overdue = openMonths.filter((month) => {
    const monthEnd = getMonthEndFromLabel(month.label);
    const graceDate = new Date(monthEnd);
    graceDate.setDate(graceDate.getDate() + mess.closeGracePeriodDays);
    return new Date() > graceDate;
  });

  for (const month of overdue) {
    await closeOpenMonth(membership.messId, month.id);

    await notifyMessMembers({
      messId: membership.messId,
      actorUserId: membership.userId,
      payload: {
        title: "Month closed",
        body: `${month.label} has been closed. Check the report and history.`,
        url: "/reports",
      },
    });
  }

  revalidatePath("/history");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  refresh();
}
