import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getActiveMembership } from "@/lib/auth/mess";

export const dynamic = "force-dynamic";

type NeonSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export async function GET() {
  const { data } = await auth.getSession();
  const user = data?.user as NeonSessionUser | undefined;

  if (!user) {
    return NextResponse.json({ user: null, membership: null }, { status: 401 });
  }

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
}
