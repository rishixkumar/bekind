"use client";

import { useActionState } from "react";
import { signUpAction } from "@/lib/actions/auth";
import { SITE_NAME } from "@/lib/constants";
import { GT_EMAIL_HINT } from "@/lib/gt-email";
import type { ActionState } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Georgia Tech email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="gburdell3@gatech.edu"
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{GT_EMAIL_HINT}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
        />
        {state.fieldErrors?.username ? (
          <p className="text-xs text-destructive">{state.fieldErrors.username}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This is what people see when you don’t post anonymously.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : `Join ${SITE_NAME}`}
      </Button>
    </form>
  );
}
