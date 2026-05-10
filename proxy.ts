import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login"
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/expenses/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/setup-mess/:path*",
    "/onboarding/:path*",
    "/auth/callback/:path*"
  ]
};
