import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // qr.labelfoodtrack.com/BATCH → rewrite to /qr/BATCH
  if (host.startsWith("qr.")) {
    const { pathname } = request.nextUrl;

    if (
      pathname.startsWith("/qr/") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = `/qr${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
