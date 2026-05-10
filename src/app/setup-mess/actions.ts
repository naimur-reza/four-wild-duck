"use server";

import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/server";

export async function createMess(formData: FormData) {
  const user = await ensureProfile();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const openingBalance = Number(formData.get("opening_balance") || 0);
  if (!name) return;

  const { data: mess, error: messError } = await supabase.from("messes").insert({ name, created_by: user.id }).select("id").single();
  if (messError || !mess) throw new Error(messError?.message || "Could not create mess");

  const { error: memberError } = await supabase.from("mess_members").insert({ mess_id: mess.id, user_id: user.id, role: "OWNER", opening_balance: openingBalance, status: "active" });
  if (memberError) throw new Error(memberError.message);
  redirect("/dashboard");
}
