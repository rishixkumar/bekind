import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportDialog } from "@/components/report-dialog";
import { ReplyForm } from "@/components/reply-form";
import { ReplyTree } from "@/components/reply-tree";
import { UpvoteButton } from "@/components/upvote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/post-form";
import { createReplyAction } from "@/lib/actions/replies";
import { deletePostAction, updatePostAction } from "@/lib/actions/posts";
import { togglePostVote } from "@/lib/actions/votes";
import { displayName, formatTimeAgo, wasEdited } from "@/lib/format";
import { getThread } from "@/lib/queries";
import { getAppUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAppUser();
  const thread = await getThread(id, user, { includeHidden: Boolean(user?.isAdmin) });
  if (!thread) notFound();

  const { post, replies } = thread;
  const name = displayName({
    username: post.authorUsername,
    isAnonymous: post.isAnonymous,
    isAdmin: user?.isAdmin,
    isAuthor: user?.id === post.authorId,
  });
  const canEdit = user?.id === post.authorId;
  const loginHref = `/login?next=/posts/${id}`;

  return (
    <article className="flex flex-col gap-6">
      <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
        {post.hiddenAt ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Hidden from the public ({post.hiddenBy})
          </p>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span>
          {post.isAnonymous ? <Badge variant="secondary">Anonymous</Badge> : null}
          <span>· {formatTimeAgo(post.createdAt)}</span>
          {wasEdited(post.createdAt, post.updatedAt) ? <span>· edited</span> : null}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{post.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{post.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1">
          <UpvoteButton
            count={post.voteCount}
            voted={post.viewerVoted}
            action={user ? togglePostVote.bind(null, post.id) : undefined}
            loginHref={user ? undefined : loginHref}
          />
          {user && !user.isBanned ? (
            <ReportDialog targetType="post" targetId={post.id} />
          ) : user ? null : (
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link href={loginHref}>Report</Link>
            </Button>
          )}
          {canEdit ? (
            <>
              <details>
                <summary className="cursor-pointer list-none text-sm text-muted-foreground">
                  <span className="inline-flex h-7 items-center rounded-full px-2.5 hover:bg-muted">
                    Edit
                  </span>
                </summary>
                <div className="mt-3">
                  <PostForm
                    action={updatePostAction.bind(null, post.id)}
                    submitLabel="Save"
                    defaultTitle={post.title}
                    defaultBody={post.body}
                    showAnonymous={false}
                  />
                </div>
              </details>
              <form action={deletePostAction.bind(null, post.id)}>
                <Button type="submit" variant="ghost" size="sm" className="rounded-full">
                  Delete
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">
          Replies{" "}
          <span className="font-medium text-muted-foreground">({post.replyCount})</span>
        </h2>
        {user && !user.isBanned ? (
          <div className="rounded-3xl bg-card p-4 ring-1 ring-foreground/5">
            <ReplyForm action={createReplyAction.bind(null, post.id)} />
          </div>
        ) : user ? (
          <p className="text-sm text-muted-foreground">
            Your account can still read Be Kind, but posting is paused.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href={loginHref} className="font-medium text-foreground underline-offset-2 hover:underline">
              Log in
            </Link>{" "}
            to reply.
          </p>
        )}
        <ReplyTree replies={replies} postId={post.id} user={user} />
      </section>
    </article>
  );
}
