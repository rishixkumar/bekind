import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-extrabold">That’s gone</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This post isn’t here, or it was hidden.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/">Back to the room</Link>
      </Button>
    </div>
  );
}
