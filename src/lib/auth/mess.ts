import type { MessRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function getActiveMembership(userId: string) {
  return prisma.messMember.findFirst({
    where: { userId, status: "ACTIVE" },
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
