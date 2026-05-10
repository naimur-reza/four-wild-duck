import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { stackServerApp } from "@/lib/auth/stack";

function makeUsername(email?: string | null, fallback?: string | null) {
  const base = email?.split("@")[0] || fallback || "member";
  return base.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export async function getCurrentUser() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function ensureProfile() {
  const user = await getCurrentUser();
  const email = user.primaryEmail || null;
  const name = user.displayName || email?.split("@")[0] || "Member";
  const avatarUrl = user.profileImageUrl || null;
  const username = makeUsername(email, name);

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { name, email, avatarUrl },
    create: { userId: user.id, name, email, avatarUrl, username }
  });

  return user;
}
