import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (!token) {
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname.startsWith("/visitor") ||
      pathname === "/terms-conditions"
    ) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (token) {
    if (pathname === "/") {
      switch (token.role) {
        case "admin":
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        case "user":
          return NextResponse.redirect(new URL("/user/dashboard", req.url));
        case "security":
          return NextResponse.redirect(new URL("/security/dashboard", req.url));
        default:
          return NextResponse.redirect(new URL("/error/restricted", req.url));
      }
    }

    if (pathname.startsWith("/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/error/restricted", req.url));
    }

    if (pathname.startsWith("/user") && token.role !== "user") {
      return NextResponse.redirect(new URL("/error/restricted", req.url));
    }

    if (pathname.startsWith("/security") && token.role !== "security") {
      return NextResponse.redirect(new URL("/error/restricted", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};