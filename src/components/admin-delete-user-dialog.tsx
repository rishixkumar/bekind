"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/lib/actions/admin";
import type { DeleteUserTally } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminDeleteUserDialog({
  userId,
  username,
  email,
  postCount,
  replyCount,
  onDeleted,
}: {
  userId: string;
  username: string;
  email: string;
  postCount: number;
  replyCount: number;
  onDeleted: (tally: DeleteUserTally) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(userId, confirmation);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      reset(false);
      onDeleted(result.deleted);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={reset}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive">
          <Trash2 />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {username}?</AlertDialogTitle>
          <AlertDialogDescription>
            This erases the account for good — there is no undo, and nothing is
            archived.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            {postCount} {postCount === 1 ? "post" : "posts"} and{" "}
            {replyCount} {replyCount === 1 ? "reply" : "replies"} written by{" "}
            {username}
          </li>
          <li>
            Every reply left on those posts, including replies from other people
          </li>
          <li>Their votes, reports they filed, and their verification codes</li>
          <li>
            <span className="text-foreground">{email}</span> and the name{" "}
            <span className="text-foreground">{username}</span> become available
            for anyone to claim again
          </li>
        </ul>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`confirm-${userId}`}>
            Type {username} to confirm
          </Label>
          <Input
            id={`confirm-${userId}`}
            value={confirmation}
            autoComplete="off"
            onChange={(event) => {
              setConfirmation(event.target.value);
              setError(null);
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending || confirmation.trim() !== username}
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete forever"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
