import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">That’s gone</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page isn’t here, or it was hidden.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/">Back to {SITE_NAME}</Link>
      </Button>
    </div>
  );
}
