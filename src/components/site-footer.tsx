import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white px-4 py-5">
      <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
        {SITE_NAME} is peer support, not professional help. If you’re in crisis
        in the US, call or text{" "}
        <a
          className="font-medium text-gt-navy underline-offset-2 hover:underline"
          href="https://988lifeline.org/"
          rel="noreferrer"
          target="_blank"
        >
          988
        </a>
        .
      </p>
    </footer>
  );
}
