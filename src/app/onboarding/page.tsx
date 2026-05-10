import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await ensureProfile();
  const membership = await getActiveMembership(user.id);

  if (membership) redirect("/dashboard");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });

  const email = profile?.email?.toLowerCase();

  if (email) {
    const invite = await prisma.memberInvite.findFirst({
      where: {
        email,
        acceptedAt: null
      },
      orderBy: { createdAt: "asc" }
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
