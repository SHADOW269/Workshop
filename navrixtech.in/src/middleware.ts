import { NextResponse } from "next/server";
import NextAuth from "next-auth";

const { auth } = NextAuth({
  providers: [],
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage && session?.user) {
    return Response.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
      return Response.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/checkout")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/api/razorpay")) {
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Policy", "api");
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/api/razorpay/:path*",
    "/api/:path*",
  ],
};
