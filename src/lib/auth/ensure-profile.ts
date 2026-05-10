import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  return user;
}

export async function ensureProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Member";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const username = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_\-]/g, "-") || null;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      name: fullName,
      username,
      avatar_url: avatarUrl,
      email: user.email
    },
    { onConflict: "user_id" }
  );

  return user;
}
