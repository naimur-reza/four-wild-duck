import { stackServerApp } from "@/lib/auth/stack";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/members", "/expenses", "/payments", "/reports", "/history", "/settings", "/setup-mess", "/onboarding"];
const publicRoutes = ["/login", "/handler"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const user = await stackServerApp.getUser();

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!isProtected && !isPublic) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
