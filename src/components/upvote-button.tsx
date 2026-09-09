import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UpvoteButton({
  count,
  voted,
  action,
  loginHref,
}: {
  count: number;
  voted: boolean;
  action?: (formData: FormData) => void | Promise<void>;
  loginHref?: string;
}) {
  const inner = (
    <>
      <Heart
        className={cn("size-4", voted && "fill-primary text-primary")}
      />
      <span>{count}</span>
    </>
  );

  if (loginHref) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href={loginHref}>{inner}</Link>
      </Button>
    );
  }

  return (
    <form action={action}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-pressed={voted}
      >
        {inner}
      </Button>
    </form>
  );
}
