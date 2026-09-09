"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts, replies } from "@/db/schema";
import { bannedMessage, requireActiveUser, requireUser } from "@/lib/session";
import { replySchema, type ActionState } from "@/lib/validations";

function readAnonymous(formData: FormData) {
  return formData.get("isAnonymous") === "true" || formData.get("isAnonymous") === "on";
}

export async function createReplyAction(
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    if (error instanceof Error && error.message === "BANNED") {
      return { error: bannedMessage() };
    }
    throw error;
  }

  const parentRaw = String(formData.get("parentId") ?? "").trim();
  const parsed = replySchema.safeParse({
    body: String(formData.get("body") ?? ""),
    isAnonymous: readAnonymous(formData),
    parentId: parentRaw ? parentRaw : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not reply." };
  }

  const db = getDb();
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.hiddenAt) return { error: "This post is gone." };

  if (parsed.data.parentId) {
    const [parent] = await db
      .select()
      .from(replies)
      .where(eq(replies.id, parsed.data.parentId))
      .limit(1);
    if (!parent || parent.postId !== postId || parent.hiddenAt) {
      return { error: "That reply is gone." };
    }
  }

  await db.insert(replies).values({
    postId,
    parentId: parsed.data.parentId ?? null,
    authorId: user.id,
    body: parsed.data.body,
    isAnonymous: parsed.data.isAnonymous,
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
  return {};
}

export async function updateReplyAction(
  replyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    if (error instanceof Error && error.message === "BANNED") {
      return { error: bannedMessage() };
    }
    throw error;
  }

  const parsed = replySchema.safeParse({
    body: String(formData.get("body") ?? ""),
    isAnonymous: false,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not save." };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId))
    .limit(1);

  if (!existing || existing.hiddenAt) return { error: "Reply not found." };
  if (existing.authorId !== user.id) return { error: "You can only edit your own reply." };

  await db
    .update(replies)
    .set({ body: parsed.data.body, updatedAt: new Date() })
    .where(eq(replies.id, replyId));

  revalidatePath(`/posts/${existing.postId}`);
  return {};
}

export async function updateReplyFormAction(replyId: string, formData: FormData) {
  await updateReplyAction(replyId, {}, formData);
}

export async function deleteReplyAction(replyId: string) {
  const user = await requireUser();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId))
    .limit(1);

  if (!existing || existing.hiddenAt) return;
  if (existing.authorId !== user.id && !user.isAdmin) return;

  await db
    .update(replies)
    .set({
      hiddenAt: new Date(),
      hiddenBy: user.isAdmin && existing.authorId !== user.id ? "admin" : "author",
    })
    .where(eq(replies.id, replyId));

  revalidatePath(`/posts/${existing.postId}`);
  revalidatePath("/");
  revalidatePath("/admin");
}
