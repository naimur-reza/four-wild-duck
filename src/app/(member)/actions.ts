"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ExpenseCategory, MemberStatus, MessRole } from "@/generated/prisma/client";
import {
  assertCanCloseMonth,
  assertCanManageMembers,
  canAddExpenseForMember,
  canManageMoney,
  closeOpenMonth,
  getCurrentOpenMonth,
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

function revalidateExpenseViews() {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

function revalidatePaymentViews() {
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
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

export async function addExpense(formData: FormData) {
  const membership = await requireMembership();
  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id") || membership.id;

  if (!canAddExpenseForMember(membership.role, membership.id, memberId)) return;

  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId, status: "ACTIVE" },
    include: { profile: true }
  });
  if (!member) return;

  const amount = toDecimal(formData.get("amount"));
  const note = text(formData, "note") || null;
  const category = getCategory(text(formData, "category"));

  await prisma.expense.create({
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

  await notifyMessMembers({
    messId: membership.messId,
    actorUserId: membership.userId,
    payload: {
      title: "New expense added",
      body: `${member.profile.name} added ${formatTaka(Number(amount))}${note ? ` for ${note}` : ` in ${category}`}.`,
      url: "/expenses"
    }
  });

  revalidateExpenseViews();
}

export async function updateExpense(formData: FormData) {
  const membership = await requireMembership();
  const expenseId = text(formData, "expense_id");
  const memberId = text(formData, "member_id") || membership.id;
  if (!expenseId) return;

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, messId: membership.messId } });
  if (!expense) return;
  if (!canAddExpenseForMember(membership.role, membership.id, expense.memberId || "")) return;
  if (!canAddExpenseForMember(membership.role, membership.id, memberId)) return;

  const member = await prisma.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } });
  if (!member) return;

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      memberId,
      category: getCategory(text(formData, "category")),
      amount: toDecimal(formData.get("amount")),
      date: parseDate(formData.get("date")),
      note: text(formData, "note") || null
    }
  });

  revalidateExpenseViews();
}

export async function deleteExpense(formData: FormData) {
  const membership = await requireMembership();
  const expenseId = text(formData, "expense_id");
  if (!expenseId) return;

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, messId: membership.messId } });
  if (!expense) return;
  if (!canAddExpenseForMember(membership.role, membership.id, expense.memberId || "")) return;

  await prisma.expense.delete({ where: { id: expenseId } });

  revalidateExpenseViews();
}

export async function addPayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id");
  const member = await prisma.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } });

  if (!member) return;

  await prisma.cashPayment.create({
    data: {
      messId: membership.messId,
      monthId: month.id,
      memberId,
      amount: toDecimal(formData.get("amount")),
      date: parseDate(formData.get("date")),
      note: text(formData, "note") || null
    }
  });

  revalidatePaymentViews();
}

export async function updatePayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const paymentId = text(formData, "payment_id");
  const memberId = text(formData, "member_id");
  if (!paymentId || !memberId) return;

  const [payment, member] = await Promise.all([
    prisma.cashPayment.findFirst({ where: { id: paymentId, messId: membership.messId } }),
    prisma.messMember.findFirst({ where: { id: memberId, messId: membership.messId, status: "ACTIVE" } })
  ]);

  if (!payment || !member) return;

  await prisma.cashPayment.update({
    where: { id: paymentId },
    data: {
      memberId,
      amount: toDecimal(formData.get("amount")),
      date: parseDate(formData.get("date")),
      note: text(formData, "note") || null
    }
  });

  revalidatePaymentViews();
}

export async function deletePayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const paymentId = text(formData, "payment_id");
  if (!paymentId) return;

  const payment = await prisma.cashPayment.findFirst({ where: { id: paymentId, messId: membership.messId } });
  if (!payment) return;

  await prisma.cashPayment.delete({ where: { id: paymentId } });

  revalidatePaymentViews();
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

  revalidatePath("/reports");
  revalidatePath("/history");
  revalidatePath("/dashboard");
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
