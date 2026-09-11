"use client";

import { useActionState } from "react";
import { AnonymousToggle } from "@/components/anonymous-toggle";
import { SmoothTextarea } from "@/components/smooth-textarea";
import { Button } from "@/components/ui/button";
import { REPLY_MAX } from "@/lib/constants";
import type { ActionState } from "@/lib/validations";

export function ReplyForm({
  action,
  parentId,
  placeholder = "Write a kind reply…",
  compact = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <SmoothTextarea
        name="body"
        required
        maxLength={REPLY_MAX}
        placeholder={placeholder}
        minRows={compact ? 3 : 4}
        className={compact ? "min-h-20" : "min-h-28"}
      />
      <AnonymousToggle label="Reply as Anonymous" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size={compact ? "sm" : "default"}>
          {pending ? "Sending…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
