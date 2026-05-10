import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";

export default async function OnboardingPage() {
  const user = await ensureProfile();
  const membership = await getActiveMembership(user.id);

  if (membership) redirect("/dashboard");
  redirect("/setup-mess");
}
