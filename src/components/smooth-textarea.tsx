"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SmoothTextareaProps = React.ComponentProps<"textarea"> & {
  /** Approximate minimum visible rows before content grows. */
  minRows?: number;
};

/**
 * Compose-surface textarea tuned for fluid typing:
 * comfortable measure, caret-friendly spacing, native field-sizing autosize,
 * and focus polish — without a heavy editor.
 */
function SmoothTextarea({
  className,
  minRows = 4,
  style,
  onInput,
  ref,
  ...props
}: SmoothTextareaProps) {
  const localRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Keep height in sync for browsers that ignore field-sizing, without
  // transitioning height (that causes lag behind keystrokes).
  const syncHeight = React.useCallback(() => {
    const el = localRef.current;
    if (!el) return;
    if (typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content")) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  React.useLayoutEffect(() => {
    syncHeight();
  }, [syncHeight, props.value, props.defaultValue]);

  return (
    <textarea
      {...props}
      ref={setRefs}
      data-slot="smooth-textarea"
      rows={minRows}
      onInput={(event) => {
        syncHeight();
        onInput?.(event);
      }}
      style={style}
      className={cn(
        "smooth-textarea field-sizing-content flex w-full resize-none overflow-hidden",
        "rounded-lg border border-input bg-card text-foreground",
        "px-3.5 py-3 text-base leading-relaxed tracking-[0.01em]",
        "shadow-none outline-none",
        "placeholder:text-muted-foreground/80",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "hover:border-ring/40",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:disabled:bg-input/80",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
    />
  );
}

export { SmoothTextarea };
