export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 px-4 py-6">
      <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
        Be Kind is peer support, not professional help. If you’re in crisis in
        the US, call or text{" "}
        <a
          className="font-semibold text-foreground underline-offset-2 hover:underline"
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
