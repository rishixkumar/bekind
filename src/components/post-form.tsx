"use client";

import { useActionState } from "react";
import { AnonymousToggle } from "@/components/anonymous-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BODY_MAX, TITLE_MAX } from "@/lib/constants";
import type { ActionState } from "@/lib/validations";

export function PostForm({
  action,
  submitLabel,
  defaultTitle = "",
  defaultBody = "",
  showAnonymous = true,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  defaultTitle?: string;
  defaultBody?: string;
  showAnonymous?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={TITLE_MAX}
          defaultValue={defaultTitle}
          placeholder="What’s on your mind?"
        />
        {state.fieldErrors?.title ? (
          <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Your thoughts</Label>
        <Textarea
          id="body"
          name="body"
          required
          maxLength={BODY_MAX}
          defaultValue={defaultBody}
          className="min-h-40"
          placeholder="Write it out. You can post as you, or anonymously."
        />
        {state.fieldErrors?.body ? (
          <p className="text-xs text-destructive">{state.fieldErrors.body}</p>
        ) : null}
      </div>
      {showAnonymous ? <AnonymousToggle /> : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
