"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CookingStatus } from "@/generated/prisma/client";
import { canManageMoney, parseDate, requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getCookingStatus(value: string): CookingStatus {
  const statuses: CookingStatus[] = ["COMPLETED", "SKIPPED", "SWAPPED"];
  return statuses.includes(value as CookingStatus) ? (value as CookingStatus) : "COMPLETED";
}

function revalidateCooking() {
  revalidatePath("/cooking");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/history");
}

async function assertActiveMember(messId: string, memberId: string) {
  return prisma.messMember.findFirst({
    where: { id: memberId, messId, status: "ACTIVE" },
    select: { id: true }
  });
}

function canManageEntry(actorRole: string, actorMemberId: string, targetMemberId: string) {
  return canManageMoney(actorRole) || actorMemberId === targetMemberId;
}

export async function addCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  const selectedMemberId = text(formData, "member_id");
  const memberId = canManageMoney(membership.role) && selectedMemberId ? selectedMemberId : membership.id;
  const date = parseDate(formData.get("date"));
  const status = getCookingStatus(text(formData, "status"));
  const comment = text(formData, "comment") || null;

  if (!canManageEntry(membership.role, membership.id, memberId)) redirect("/cooking?cookingStatus=not-allowed");

  const member = await assertActiveMember(membership.messId, memberId);
  if (!member) redirect("/cooking?cookingStatus=invalid-member");

  try {
    await prisma.cookingEntry.create({
      data: {
        messId: membership.messId,
        memberId,
        date,
        status,
        comment
      }
    });
  } catch {
    redirect("/cooking?cookingStatus=duplicate-entry");
  }

  revalidateCooking();
  redirect("/cooking?cookingStatus=entry-saved");
}

export async function updateCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  const entryId = text(formData, "entry_id");
  if (!entryId) return;

  const entry = await prisma.cookingEntry.findFirst({
    where: { id: entryId, messId: membership.messId },
    select: { id: true, memberId: true }
  });

  if (!entry) return;
  if (!canManageEntry(membership.role, membership.id, entry.memberId)) redirect("/cooking?cookingStatus=not-allowed");

  await prisma.cookingEntry.update({
    where: { id: entryId },
    data: {
      status: getCookingStatus(text(formData, "status")),
      comment: text(formData, "comment") || null
    }
  });

  revalidateCooking();
}

export async function deleteCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  const entryId = text(formData, "entry_id");
  if (!entryId) return;

  const entry = await prisma.cookingEntry.findFirst({
    where: { id: entryId, messId: membership.messId },
    select: { id: true, memberId: true }
  });

  if (!entry) return;
  if (!canManageEntry(membership.role, membership.id, entry.memberId)) redirect("/cooking?cookingStatus=not-allowed");

  await prisma.cookingEntry.delete({ where: { id: entryId } });
  revalidateCooking();
}

export async function rateCookingEntry(formData: FormData) {
  const membership = await requireMembership();
  const entryId = text(formData, "entry_id");
  const rating = Math.min(Math.max(Number(text(formData, "rating")), 1), 5);

  if (!entryId || !Number.isFinite(rating)) return;

  const entry = await prisma.cookingEntry.findFirst({
    where: { id: entryId, messId: membership.messId },
    select: { id: true }
  });

  if (!entry) return;

  await prisma.cookingRating.upsert({
    where: {
      entryId_memberId: {
        entryId,
        memberId: membership.id
      }
    },
    update: { rating },
    create: {
      entryId,
      memberId: membership.id,
      rating
    }
  });

  revalidateCooking();
}

export async function addUnavailableDate(formData: FormData) {
  const membership = await requireMembership();
  if (!canManageMoney(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

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
  if (!canManageMoney(membership.role)) redirect("/cooking?cookingStatus=not-allowed");

  const id = text(formData, "unavailable_id");
  if (!id) return;

  await prisma.cookingUnavailable.deleteMany({ where: { id, messId: membership.messId } });
  revalidateCooking();
}
