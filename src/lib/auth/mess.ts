import { createClient } from "@/lib/supabase/server";

export type MessRole = "OWNER" | "MANAGER" | "MEMBER";

export async function getActiveMembership(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mess_members")
    .select("id, mess_id, user_id, role, opening_balance, status, messes(id, name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export function canManageMembers(role?: MessRole | null) { return role === "OWNER" || role === "MANAGER"; }
export function canCloseMonth(role?: MessRole | null) { return role === "OWNER" || role === "MANAGER"; }
export function canChangeRoles(role?: MessRole | null) { return role === "OWNER"; }
