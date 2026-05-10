import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const knownAuthCookieNames = [
  "neon-auth.next.session_data",
  "__Secure-neon-auth.next.session_data",
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
  "better-auth.csrf_token",
  "__Secure-better-auth.csrf_token"
];

function expireCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  response.cookies.set(name, "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

async function logout() {
  try {
    await auth.signOut();
  } catch {
    // Continue with manual cookie cleanup even if the SDK sign out fails.
  }

  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  const cookieStore = await cookies();
  const requestCookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  const authCookieNames = new Set([
    ...knownAuthCookieNames,
    ...requestCookieNames.filter((name) =>
      name.toLowerCase().includes("auth") ||
      name.toLowerCase().includes("session") ||
      name.toLowerCase().includes("token")
    )
  ]);

  for (const name of authCookieNames) {
    expireCookie(response, name);
  }

  return response;
}

export async function GET() {
  return logout();
}

export async function POST() {
  return logout();
}
