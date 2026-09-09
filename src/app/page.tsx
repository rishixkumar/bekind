import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getFeedPosts } from "@/lib/queries";
import { getAppUser } from "@/lib/session";
import { SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAppUser();
  const posts = await getFeedPosts(user);
  const composeHref = user ? "/posts/new" : "/login?next=/posts/new";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gt-navy">The room</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest thoughts first. Anyone can read. Log in to post.
          </p>
        </div>
        <Button asChild>
          <Link href={composeHref}>New post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-md border border-border bg-card px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-gt-navy">{SITE_NAME} is quiet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Share what’s on your mind. You can use your name or stay anonymous.
          </p>
          <Button className="mt-4" asChild>
            <Link href={composeHref}>New post</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
