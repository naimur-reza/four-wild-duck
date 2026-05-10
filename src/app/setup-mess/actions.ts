"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ensureProfile } from "@/lib/auth/ensure-profile";

export async function createMess(formData: FormData) {
  const user = await ensureProfile();
  const name = String(formData.get("name") || "").trim();
  const openingBalance = Number(formData.get("opening_balance") || 0);

  if (!name) return;

  const mess = await prisma.mess.create({
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

  await prisma.month.create({
    data: {
      messId: mess.id,
      label: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      memberCount: 1,
      status: "OPEN"
    }
  });

  redirect("/dashboard");
}
