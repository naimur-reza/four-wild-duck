import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const membership = await getActiveMembership(user.id);

    return NextResponse.json({
      user,
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
