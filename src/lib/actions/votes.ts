"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts, replies, votes } from "@/db/schema";
import { requireActiveUser, writeGateMessage } from "@/lib/session";

export async function togglePostVote(postId: string) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    if (writeGateMessage(error)) return;
    throw error;
  }

  const db = getDb();
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.hiddenAt) return;


  const [existing] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, user.id), eq(votes.postId, postId)))
    .limit(1);

  if (existing) {
    await db.delete(votes).where(eq(votes.id, existing.id));
  } else {
    await db.insert(votes).values({ userId: user.id, postId });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function toggleReplyVote(replyId: string) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (error) {
    if (writeGateMessage(error)) return;
    throw error;
  }

  const db = getDb();
  const [reply] = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId))
    .limit(1);
  if (!reply || reply.hiddenAt) return;

  const [existing] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, user.id), eq(votes.replyId, replyId)))
    .limit(1);

  if (existing) {
    await db.delete(votes).where(eq(votes.id, existing.id));
  } else {
    await db.insert(votes).values({
      userId: user.id,
      replyId,
      postId: null,
    });
  }

  revalidatePath(`/posts/${reply.postId}`);
}
