import { NextRequest, NextResponse } from "next/server";

import { API_ROUTES } from "./infrastructure/config/apiRoutes";
import { protectedRoutes, ROUTES } from "./infrastructure/config/routes";

export const config = {
  matcher: [`${ROUTES.dashboard}/:path*`],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const cookie = req.headers.get("cookie") || "";
  const loginUrl = new URL(ROUTES.login, req.url);

  if (cookie === "") {
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + API_ROUTES.AUTH_CHECK,
      { headers: { cookie } }
    );

    if (response.status !== 200) {
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    //TODO: add log to sentry
    console.error("Error fetching user data:", error);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
