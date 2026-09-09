import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { getAppUser } from "@/lib/session";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getAppUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Be Kind
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {user.isAdmin ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.username}
              </span>
              <Button size="sm" asChild>
                <Link href="/posts/new">New post</Link>
              </Button>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
