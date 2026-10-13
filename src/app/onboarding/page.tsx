import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await ensureProfile();

  const membership = await prisma.messMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { id: true },
    orderBy: { createdAt: "asc" }
  });

  if (membership) redirect("/dashboard");

  if (user.email) {
    const invite = await prisma.memberInvite.findFirst({
      where: {
        email: user.email.toLowerCase(),
        acceptedAt: null
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        messId: true,
        role: true,
        openingBalance: true
      }
    });

    if (invite) {
      await prisma.$transaction(async (tx) => {
        await tx.messMember.upsert({
          where: {
            messId_userId: {
              messId: invite.messId,
              userId: user.id
            }
          },
          update: {
            role: invite.role,
            openingBalance: invite.openingBalance,
            status: "ACTIVE"
          },
          create: {
            messId: invite.messId,
            userId: user.id,
            role: invite.role,
            openingBalance: invite.openingBalance,
            status: "ACTIVE"
          }
        });

        await tx.memberInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() }
        });
      });

      redirect("/dashboard");
    }
  }

  redirect("/setup-mess");
}
