import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await auth.signOut();
  redirect("/login");
}

export async function POST() {
  await auth.signOut();
  redirect("/login");
}
