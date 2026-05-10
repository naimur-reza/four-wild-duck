import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

type NeonSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

function makeUsername(email?: string | null, fallback?: string | null) {
  const base = email?.split("@")[0] || fallback || "member";
  return base.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export async function getCurrentUser() {
  const { data } = await auth.getSession();
  const user = data?.user as NeonSessionUser | undefined;

  if (!user) redirect("/login");
  return user;
}

export async function ensureProfile() {
  const user = await getCurrentUser();
  const email = user.email || null;
  const name = user.name || email?.split("@")[0] || "Member";
  const avatarUrl = user.image || null;
  const username = makeUsername(email, name);

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { name, email, avatarUrl },
    create: { userId: user.id, name, email, avatarUrl, username }
  });

  return user;
}
