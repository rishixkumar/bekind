"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { requireActiveUser, requireUser, writeGateMessage } from "@/lib/session";
import { postSchema, type ActionState } from "@/lib/validations";

function readAnonymous(formData: FormData) {
  return formData.get("isAnonymous") === "true" || formData.get("isAnonymous") === "on";
}

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    const message = writeGateMessage(error);
    if (message) return { error: message };
    throw error;
  }

  const parsed = postSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    isAnonymous: readAnonymous(formData),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const db = getDb();
  const [created] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      isAnonymous: parsed.data.isAnonymous,
    })
    .returning({ id: posts.id });

  revalidatePath("/");
  redirect(`/posts/${created.id}`);
}

export async function updatePostAction(
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    const message = writeGateMessage(error);
    if (message) return { error: message };
    throw error;
  }

  const parsed = postSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    isAnonymous: readAnonymous(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not save." };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existing || existing.hiddenAt) return { error: "Post not found." };
  if (existing.authorId !== user.id) return { error: "You can only edit your own post." };

  await db
    .update(posts)
    .set({
      title: parsed.data.title,
      body: parsed.data.body,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function deletePostAction(postId: string) {
  const user = await requireUser();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existing || existing.hiddenAt) return;
  if (existing.authorId !== user.id && !user.isAdmin) return;

  await db
    .update(posts)
    .set({
      hiddenAt: new Date(),
      hiddenBy: user.isAdmin && existing.authorId !== user.id ? "admin" : "author",
    })
    .where(eq(posts.id, postId));

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/admin");
  if (!user.isAdmin) redirect("/");
}
