"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CookingStatus } from "@/generated/prisma/client";
import { canManageMoney, parseDate, requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function canManageCooking(role: string) {
  return canManageMoney(role);
}

function getCookingStatus(value: string): CookingStatus {
  const statuses: CookingStatus[] = ["SCHEDULED", "COMPLETED", "SKIPPED", "SWAPPED"];
  return statuses.includes(value as CookingStatus) ? (value as CookingStatus) : "COMPLETED";
}

function revalidateCooking() {
  revalidatePath("/cooking");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/history");
}

async function assertActiveMember(messId: string, memberId: string) {
  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId, status: "ACTIVE" },
    select: { id: true }
  });

  return member;
}

export async function addCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const cookedById = text(formData, "cooked_by_id");
  const assignedToId = text(formData, "assigned_to_id") || cookedById;
  const date = parseDate(formData.get("date"));
  const status = getCookingStatus(text(formData, "status"));
  const comment = text(formData, "comment") || null;

  if (!cookedById) redirect("/cooking?cookingStatus=invalid-member");
  const cookedBy = await assertActiveMember(membership.messId, cookedById);
  const assignedTo = assignedToId ? await assertActiveMember(membership.messId, assignedToId) : null;

  if (!cookedBy || (assignedToId && !assignedTo)) redirect("/cooking?cookingStatus=invalid-member");

  await prisma.cookingDay.upsert({
    where: {
      messId_date: {
        messId: membership.messId,
        date
      }
    },
    update: {
      assignedToId,
      cookedById,
      status,
      comment
    },
    create: {
      messId: membership.messId,
      date,
      assignedToId,
      cookedById,
      status,
      comment
    }
  });

  revalidateCooking();
  redirect("/cooking?cookingStatus=entry-saved");
}

export async function deleteCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const dayId = text(formData, "day_id");
  if (!dayId) return;

  await prisma.cookingDay.deleteMany({ where: { id: dayId, messId: membership.messId } });
  revalidateCooking();
}

export async function updateCookingDay(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const dayId = text(formData, "day_id");
  const assignedToId = text(formData, "assigned_to_id") || null;
  const cookedById = text(formData, "cooked_by_id") || assignedToId;
  const status = getCookingStatus(text(formData, "status"));
  const comment = text(formData, "comment") || null;

  if (!dayId) return;

  const day = await prisma.cookingDay.findFirst({
    where: { id: dayId, messId: membership.messId },
    select: { id: true }
  });

  if (!day) return;

  await prisma.cookingDay.update({
    where: { id: dayId },
    data: {
      assignedToId,
      cookedById: status === "COMPLETED" || status === "SWAPPED" ? cookedById : null,
      status,
      comment
    }
  });

  revalidateCooking();
}

export async function addUnavailableDate(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const memberId = text(formData, "member_id");
  const date = parseDate(formData.get("date"));
  const reason = text(formData, "reason") || null;

  const member = await assertActiveMember(membership.messId, memberId);
  if (!member) redirect("/cooking?cookingStatus=invalid-member");

  await prisma.cookingUnavailable.upsert({
    where: {
      messId_memberId_date: {
        messId: membership.messId,
        memberId,
        date
      }
    },
    update: { reason },
    create: {
      messId: membership.messId,
      memberId,
      date,
      reason
    }
  });

  revalidateCooking();
  redirect("/cooking?cookingStatus=unavailable-added");
}

export async function deleteUnavailableDate(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const id = text(formData, "unavailable_id");
  if (!id) return;

  await prisma.cookingUnavailable.deleteMany({ where: { id, messId: membership.messId } });
  revalidateCooking();
}
