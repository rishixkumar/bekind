import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/verify-form";
import { SITE_NAME } from "@/lib/constants";
import { isEmailConfigured } from "@/lib/email";
import { getAppUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const user = await getAppUser();
  if (!user) redirect("/login?next=/verify");
  if (user.isVerified) redirect("/");

  const mailerConfigured = isEmailConfigured();

  return (
    <Card className="mx-auto w-full max-w-md border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          {mailerConfigured
            ? "Check your Georgia Tech email"
            : "Email delivery isn’t ready yet"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <VerifyForm email={user.email} mailerConfigured={mailerConfigured} />
        <p className="text-center text-sm text-muted-foreground">
          You can{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-2 hover:underline">
            read the room
          </Link>{" "}
          while you wait — posting on {SITE_NAME} opens up once you’re verified.
        </p>
      </CardContent>
    </Card>
  );
}
