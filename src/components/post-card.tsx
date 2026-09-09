import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { togglePostVote } from "@/lib/actions/votes";
import { displayName, formatTimeAgo, previewText } from "@/lib/format";
import type { FeedPost } from "@/lib/queries";
import type { AppUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UpvoteButton } from "@/components/upvote-button";

export function PostCard({
  post,
  user,
}: {
  post: FeedPost;
  user: AppUser | null;
}) {
  const name = displayName({
    username: post.authorUsername,
    isAnonymous: post.isAnonymous,
    isAdmin: user?.isAdmin,
    isAuthor: user?.id === post.authorId,
  });

  return (
    <Card className="shadow-sm ring-foreground/5 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 px-4 py-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span>
          {post.isAnonymous ? (
            <Badge variant="secondary">Anonymous</Badge>
          ) : null}
          <span>· {formatTimeAgo(post.createdAt)}</span>
        </div>
        <Link href={`/posts/${post.id}`} className="group">
          <h2 className="text-lg font-bold leading-snug group-hover:underline">
            {post.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {previewText(post.body)}
          </p>
        </Link>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <UpvoteButton
            count={post.voteCount}
            voted={post.viewerVoted}
            action={user ? togglePostVote.bind(null, post.id) : undefined}
            loginHref={user ? undefined : `/login?next=/posts/${post.id}`}
          />
          <Link
            href={`/posts/${post.id}`}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 hover:bg-muted"
          >
            <MessageCircle className="size-4" />
            {post.replyCount}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
