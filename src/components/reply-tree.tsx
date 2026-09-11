import Link from "next/link";
import { createReplyAction, deleteReplyAction, updateReplyFormAction } from "@/lib/actions/replies";
import { toggleReplyVote } from "@/lib/actions/votes";
import { displayName, formatTimeAgo, wasEdited } from "@/lib/format";
import type { ThreadReply } from "@/lib/queries";
import type { AppUser } from "@/lib/session";
import { ReportDialog } from "@/components/report-dialog";
import { ReplyForm } from "@/components/reply-form";
import { UpvoteButton } from "@/components/upvote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmoothTextarea } from "@/components/smooth-textarea";

function EditReplyForm({
  replyId,
  defaultBody,
}: {
  replyId: string;
  defaultBody: string;
}) {
  const action = updateReplyFormAction.bind(null, replyId);
  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <SmoothTextarea
        name="body"
        required
        defaultValue={defaultBody}
        minRows={3}
        className="min-h-20"
      />
      <Button type="submit" size="sm">
        Save
      </Button>
    </form>
  );
}

export function ReplyTree({
  replies,
  postId,
  user,
  depth = 0,
}: {
  replies: ThreadReply[];
  postId: string;
  user: AppUser | null;
  depth?: number;
}) {
  if (replies.length === 0) return null;

  return (
    <ul
      className={
        depth === 0
          ? "flex flex-col gap-4"
          : "mt-3 flex flex-col gap-3 border-l border-border pl-3 sm:pl-4"
      }
    >
      {replies.map((reply) => {
        const name = displayName({
          username: reply.authorUsername,
          isAnonymous: reply.isAnonymous,
          isAdmin: user?.isAdmin,
          isAuthor: user?.id === reply.authorId,
        });
        const canEdit = user?.id === reply.authorId;
        const loginHref = `/login?next=/posts/${postId}`;

        return (
          <li
            key={reply.id}
            className="rounded-md border border-border bg-card p-3"
          >
            {reply.hiddenAt ? (
              <p className="text-xs text-muted-foreground">
                Hidden ({reply.hiddenBy})
              </p>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span>
              {reply.isAnonymous ? <Badge variant="secondary">Anonymous</Badge> : null}
              <span>· {formatTimeAgo(reply.createdAt)}</span>
              {wasEdited(reply.createdAt, reply.updatedAt) ? (
                <span>· edited</span>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {reply.body}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <UpvoteButton
                count={reply.voteCount}
                voted={reply.viewerVoted}
                action={user ? toggleReplyVote.bind(null, reply.id) : undefined}
                loginHref={user ? undefined : loginHref}
              />
              {user && !user.isBanned ? (
                <details>
                  <summary className="cursor-pointer list-none text-sm text-muted-foreground hover:text-foreground">
                    <span className="inline-flex h-7 items-center rounded-md px-2.5 hover:bg-muted">
                      Reply
                    </span>
                  </summary>
                  <div className="mt-2">
                    <ReplyForm
                      action={createReplyAction.bind(null, postId)}
                      parentId={reply.id}
                      compact
                    />
                  </div>
                </details>
              ) : null}
              {user && !user.isBanned ? (
                <ReportDialog targetType="reply" targetId={reply.id} />
              ) : user ? null : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={loginHref}>Report</Link>
                </Button>
              )}
              {canEdit ? (
                <>
                  <details>
                    <summary className="cursor-pointer list-none text-sm text-muted-foreground hover:text-foreground">
                      <span className="inline-flex h-7 items-center rounded-md px-2.5 hover:bg-muted">
                        Edit
                      </span>
                    </summary>
                    <EditReplyForm replyId={reply.id} defaultBody={reply.body} />
                  </details>
                  <form action={deleteReplyAction.bind(null, reply.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </form>
                </>
              ) : null}
            </div>
            <ReplyTree
              replies={reply.children}
              postId={postId}
              user={user}
              depth={depth + 1}
            />
          </li>
        );
      })}
    </ul>
  );
}
