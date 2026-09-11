"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ENTER_COOKIE_NAME } from "@/lib/hello";

/** Survives React Strict Mode remount so the entrance still plays once. */
let pendingEntrance = false;

function readEnterCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${ENTER_COOKIE_NAME}=1`);
}

function clearEnterCookie() {
  document.cookie = `${ENTER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * One-shot entrance when arriving from /hello.
 * Triggered by ?from=hello and/or a short-lived bk_from_hello cookie.
 */
export function SiteEntrance({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [play, setPlay] = useState(() => {
    const should =
      searchParams.get("from") === "hello" ||
      readEnterCookie() ||
      pendingEntrance;
    if (should) pendingEntrance = true;
    return should;
  });

  useEffect(() => {
    const fromQuery = searchParams.get("from") === "hello";
    const fromCookie = readEnterCookie();
    if (!fromQuery && !fromCookie && !pendingEntrance) return;

    // `play` is already true here: the initializer above tests the same condition.
    pendingEntrance = true;
    clearEnterCookie();
    if (fromQuery) {
      router.replace(pathname, { scroll: false });
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce ? 0 : 560;
    const timer = window.setTimeout(() => {
      pendingEntrance = false;
      setPlay(false);
    }, ms);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="site-shell flex min-h-full flex-1 flex-col"
      data-from-hello={play ? "" : undefined}
    >
      {play ? <div className="site-enter-wash" aria-hidden /> : null}
      {children}
    </div>
  );
}
