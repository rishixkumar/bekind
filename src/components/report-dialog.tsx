"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { reportContentAction } from "@/lib/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import type { ActionState } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialog({
  targetType,
  targetId,
}: {
  targetType: "post" | "reply";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const action = reportContentAction.bind(null, targetType, targetId);
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const succeeded = open && !pending && !state.error && state.fieldErrors == null && Object.keys(state).length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="size-3.5" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
          <DialogDescription>
            We’ll look at it. This stays between you and the admin.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              name="reason"
              required
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Choose one
              </option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="details">Anything else? (optional)</Label>
            <Textarea id="details" name="details" rows={3} />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {succeeded ? (
            <p className="text-sm text-muted-foreground">Got it. Thank you.</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Submit report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
