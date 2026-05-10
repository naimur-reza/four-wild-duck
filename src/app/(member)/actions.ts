"use server";

import { revalidatePath } from "next/cache";
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

export async function addMember(formData: FormData) {
  const membership = await requireMembership();
  assertCanManageMembers(membership.role);

  const query = text(formData, "profile");
  const requestedRole = getRole(text(formData, "role"));
  const role = membership.role === "OWNER" ? requestedRole : "MEMBER";
  const openingBalance = toDecimal(formData.get("opening_balance"));

  if (!query) return;

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { userId: query },
        { email: { equals: query, mode: "insensitive" } },
        { username: { equals: query, mode: "insensitive" } }
      ]
    }
  });

  if (!profile) return;

  await prisma.messMember.upsert({
    where: { messId_userId: { messId: membership.messId, userId: profile.userId } },
    update: { role, openingBalance, status: "ACTIVE" },
    create: {
      messId: membership.messId,
      userId: profile.userId,
      role,
      openingBalance,
      status: "ACTIVE"
    }
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");
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

  await prisma.messMember.update({
    where: { id: memberId },
    data
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function addExpense(formData: FormData) {
  const membership = await requireMembership();
  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id") || membership.id;

  if (!canAddExpenseForMember(membership.role, membership.id, memberId)) return;

  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId, status: "ACTIVE" }
  });

  if (!member) return;

  await prisma.expense.create({
    data: {
      messId: membership.messId,
      monthId: month.id,
      memberId,
      category: getCategory(text(formData, "category")),
      amount: toDecimal(formData.get("amount")),
      date: parseDate(formData.get("date")),
      note: text(formData, "note") || null
    }
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function addPayment(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) return;

  const month = await getCurrentOpenMonth(membership.messId);
  const memberId = text(formData, "member_id");
  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId, status: "ACTIVE" }
  });

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

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function closeMonth() {
  const membership = await requireMembership();
  assertCanCloseMonth(membership.role);
  const month = await getCurrentOpenMonth(membership.messId);

  await closeOpenMonth(membership.messId, month.id);

  revalidatePath("/reports");
  revalidatePath("/history");
  revalidatePath("/dashboard");
}

export async function renameMess(formData: FormData) {
  const membership = await requireMembership();
  if (membership.role !== "OWNER") return;

  const name = text(formData, "name");
  if (!name) return;

  await prisma.mess.update({
    where: { id: membership.messId },
    data: { name }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
