import Image from "next/image";
import { cn } from "@/lib/utils";

export function GtMark({ className }: { className?: string }) {
  return (
    <Image
      src="/gt-interlocking.svg"
      alt="Georgia Tech"
      width={250}
      height={157}
      unoptimized
      priority
      className={cn("h-9 w-auto", className)}
      style={{ width: "auto", height: 36 }}
    />
  );
}
