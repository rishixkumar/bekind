import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gt-navy">That’s gone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page isn’t here, or it was hidden.
        </p>
        <Button className="mt-4 self-center" asChild>
          <Link href="/">Back to {SITE_NAME}</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
