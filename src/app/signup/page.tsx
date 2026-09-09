import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppUser } from "@/lib/session";

export default async function SignupPage() {
  const user = await getAppUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/");

  return (
    <Card className="mx-auto w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold">Join Be Kind</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Pick a username. You can still post anonymously whenever you want.
        </p>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-2 hover:underline">
            Log in
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
