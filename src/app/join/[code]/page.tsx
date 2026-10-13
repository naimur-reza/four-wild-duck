import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type JoinPageProps = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const safeCode = String(code || "").trim();

  if (!safeCode) redirect("/login");

  const mess = await prisma.mess.findUnique({
    where: { inviteCode: safeCode },
    select: { id: true, name: true }
  });

  if (!mess) redirect("/login?joinStatus=invalid-link");

  const { data } = await auth.getSession();

  if (!data?.user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${safeCode}`)}`);
  }

  const user = await ensureProfile();
  const currentMembership = await getActiveMembership(user.id);

  if (currentMembership) {
    if (currentMembership.messId === mess.id) redirect("/dashboard");
    redirect("/dashboard?joinStatus=already-in-another-mess");
  }

  await prisma.messMember.create({
    data: {
      messId: mess.id,
      userId: user.id,
      role: "MEMBER",
      openingBalance: 0,
      status: "ACTIVE"
    }
  });

  redirect("/dashboard?joinStatus=joined");
}
