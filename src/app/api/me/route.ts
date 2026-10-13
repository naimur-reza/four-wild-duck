import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const [profile, membership] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { name: true, email: true, avatarUrl: true }
      }),
      getActiveMembership(user.id)
    ]);

    return NextResponse.json({
      user: {
        ...user,
        name: profile?.name || user.name || user.email?.split("@")[0] || "Member",
        email: profile?.email || user.email || null,
        image: profile?.avatarUrl || user.image || null
      },
      membership: membership
        ? {
            role: membership.role,
            messName: membership.mess.name
          }
        : null
    });
  } catch {
    return NextResponse.json({ user: null, membership: null }, { status: 401 });
  }
}
