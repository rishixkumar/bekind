import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppUser } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getAppUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/");
  const { next } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <Card className="mx-auto w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm next={nextPath} />
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Or{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-2 hover:underline">
            read the room
          </Link>{" "}
          without an account.
        </p>
      </CardContent>
    </Card>
  );
}
