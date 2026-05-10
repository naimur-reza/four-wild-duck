"use server";

import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/auth/stack";

export async function signOut() {
  await stackServerApp.signOut();
  redirect("/login");
}
