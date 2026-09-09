import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  HELLO_COOKIE_NAME,
  HELLO_COOKIE_VALUE,
  HELLO_PATH,
} from "@/lib/hello";

export function proxy(request: NextRequest) {
  const seen = request.cookies.get(HELLO_COOKIE_NAME)?.value;
  if (seen === HELLO_COOKIE_VALUE) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = HELLO_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Gate every page except the intro itself, Next internals, auth, and static assets.
    "/((?!hello(?:/|$)|_next(?:/|$)|api/auth(?:/|$)|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
