"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { currentMonthLabel } from "@/lib/utils";

export async function createMess(formData: FormData) {
  const user = await ensureProfile();
  const name = String(formData.get("name") || "").trim();
  const openingBalance = Number(formData.get("opening_balance") || 0);

  if (!name) return;

  await prisma.$transaction(async (tx) => {
    const mess = await tx.mess.create({
      data: {
        name,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            openingBalance,
            status: "ACTIVE"
          }
        }
      }
    });

    await tx.month.create({
      data: {
        messId: mess.id,
        label: currentMonthLabel(),
        memberCount: 1,
        status: "OPEN"
      }
    });
  });

  redirect("/dashboard");
}
