import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { SITE_NAME } from "@/lib/constants";
import { getAppUser } from "@/lib/session";
import { GtMark } from "@/components/gt-mark";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getAppUser();

  return (
    <header className="sticky top-0 z-20 bg-gt-navy text-white shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-white no-underline hover:opacity-90"
        >
          <GtMark />
          <span className="h-7 w-px bg-gt-gold/80" aria-hidden />
          <span className="text-lg font-bold tracking-wide">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {user.isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <span className="hidden text-sm text-white/70 sm:inline">
                {user.username}
              </span>
              <Button size="sm" asChild>
                <Link href="/posts/new">New post</Link>
              </Button>
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
      <div className="h-0.5 bg-gt-gold" aria-hidden />
    </header>
  );
}
