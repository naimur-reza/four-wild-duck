import type { MessRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function getActiveMembership(userId: string) {
  return prisma.messMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { mess: true },
    orderBy: { createdAt: "asc" }
  });
}

export function canManageMembers(role?: MessRole | null) {
  return role === "OWNER" || role === "MANAGER";
}

export function canCloseMonth(role?: MessRole | null) {
  return role === "OWNER" || role === "MANAGER";
}

export function canChangeRoles(role?: MessRole | null) {
  return role === "OWNER";
}
