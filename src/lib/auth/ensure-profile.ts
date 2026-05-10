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
  const username = base.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return username || "member";
}

async function getAvailableUsername(baseUsername: string, userId: string) {
  const existingProfile = await prisma.profile.findUnique({
    where: { userId },
    select: { username: true }
  });

  if (existingProfile?.username) return existingProfile.username;

  const cleanBase = baseUsername || "member";
  const shortUserId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toLowerCase() || Date.now().toString(36);

  const existingBase = await prisma.profile.findUnique({
    where: { username: cleanBase },
    select: { userId: true }
  });

  if (!existingBase || existingBase.userId === userId) return cleanBase;

  for (let index = 1; index <= 20; index++) {
    const candidate = `${cleanBase}-${index}`;
    const existingCandidate = await prisma.profile.findUnique({
      where: { username: candidate },
      select: { userId: true }
    });

    if (!existingCandidate || existingCandidate.userId === userId) return candidate;
  }

  return `${cleanBase}-${shortUserId}`;
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
  const username = await getAvailableUsername(makeUsername(email, name), user.id);

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { name, email, avatarUrl },
    create: { userId: user.id, name, email, avatarUrl, username }
  });

  return user;
}
