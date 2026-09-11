"use client";

import { useActionState } from "react";
import { verifyEmailAction } from "@/lib/actions/verification";
import type { ActionState } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyForm({
  email,
  mailerConfigured,
}: {
  email: string;
  mailerConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    verifyEmailAction,
    {} as ActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mailerConfigured ? (
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>. Enter it
          below to finish setting up your account.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          A verification code was created for{" "}
          <span className="font-medium text-foreground">{email}</span>, but
          email delivery isn’t configured on this deployment yet — nothing was
          emailed. Ask the site admin to set{" "}
          <span className="font-medium text-foreground">RESEND_API_KEY</span>,
          then tap “Send a new code”.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          required
          className="text-center text-lg tracking-[0.4em]"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.fieldErrors?.sent ? (
        <p className="text-sm text-muted-foreground">{state.fieldErrors.sent}</p>
      ) : null}

      <Button type="submit" name="intent" value="verify" disabled={pending}>
        {pending ? "Working…" : "Verify email"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="resend"
        variant="ghost"
        size="sm"
        disabled={pending}
        // Skip the required-code check; resending doesn't need one.
        formNoValidate
      >
        Didn’t get it? Send a new code
      </Button>
    </form>
  );
}
