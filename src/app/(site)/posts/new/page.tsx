import { redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { createPostAction } from "@/lib/actions/posts";
import { bannedMessage, getAppUser } from "@/lib/session";

export default async function NewPostPage() {
  const user = await getAppUser();
  if (!user) redirect("/login?next=/posts/new");
  if (user.isBanned) {
    return (
      <p className="text-sm text-muted-foreground">
        {bannedMessage()}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gt-navy">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Say what’s going on. You don’t have to use your name.
        </p>
      </div>
      <PostForm action={createPostAction} submitLabel="Post" />
    </div>
  );
}
