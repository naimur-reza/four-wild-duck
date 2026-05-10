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
  return statuses.includes(value as CookingStatus) ? (value as CookingStatus) : "SCHEDULED";
}

function revalidateCooking() {
  revalidatePath("/cooking");
  revalidatePath("/dashboard");
}

export async function syncCookingRoster() {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const members = await prisma.messMember.findMany({
    where: { messId: membership.messId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  const existing = await prisma.cookingRoster.findMany({
    where: { messId: membership.messId },
    orderBy: { position: "asc" },
    select: { memberId: true, position: true }
  });

  const existingIds = new Set(existing.map((item) => item.memberId));
  const maxPosition = existing.reduce((max, item) => Math.max(max, item.position), 0);
  let nextPosition = maxPosition + 1;

  await prisma.$transaction(async (tx) => {
    for (const member of members) {
      if (existingIds.has(member.id)) {
        await tx.cookingRoster.update({
          where: { messId_memberId: { messId: membership.messId, memberId: member.id } },
          data: { isActive: true }
        });
        continue;
      }

      await tx.cookingRoster.create({
        data: {
          messId: membership.messId,
          memberId: member.id,
          position: nextPosition++,
          isActive: true
        }
      });
    }

    await tx.cookingRoster.updateMany({
      where: {
        messId: membership.messId,
        memberId: { notIn: members.map((member) => member.id) }
      },
      data: { isActive: false }
    });
  });

  revalidateCooking();
  redirect("/cooking?cookingStatus=roster-synced");
}

export async function updateRosterPosition(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const rosterId = text(formData, "roster_id");
  const position = Number(text(formData, "position"));

  if (!rosterId || !Number.isFinite(position) || position < 1) redirect("/cooking?cookingStatus=invalid-position");

  const rosterItem = await prisma.cookingRoster.findFirst({
    where: { id: rosterId, messId: membership.messId },
    select: { id: true }
  });

  if (!rosterItem) redirect("/cooking?cookingStatus=not-found");

  await prisma.cookingRoster.update({
    where: { id: rosterId },
    data: { position }
  });

  revalidateCooking();
}

export async function addUnavailableDate(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageCooking(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const memberId = text(formData, "member_id");
  const date = parseDate(formData.get("date"));
  const reason = text(formData, "reason") || null;

  const member = await prisma.messMember.findFirst({
    where: { id: memberId, messId: membership.messId, status: "ACTIVE" },
    select: { id: true }
  });

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

  await prisma.cookingDay.deleteMany({
    where: {
      messId: membership.messId,
      date,
      status: "SCHEDULED"
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
