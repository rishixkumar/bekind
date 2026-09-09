"use server";

import { count, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts, replies, reports, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function getAdminStats() {
  await requireAdmin();
  const db = getDb();
  const [[userCount], [postCount], [replyCount], [reportCount]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(posts).where(isNull(posts.hiddenAt)),
    db.select({ n: count() }).from(replies).where(isNull(replies.hiddenAt)),
    db.select({ n: count() }).from(reports).where(eq(reports.status, "open")),
  ]);

  return {
    users: Number(userCount?.n ?? 0),
    posts: Number(postCount?.n ?? 0),
    replies: Number(replyCount?.n ?? 0),
    openReports: Number(reportCount?.n ?? 0),
  };
}

export async function getAdminUsers() {
  await requireAdmin();
  const db = getDb();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAdminReports() {
  await requireAdmin();
  const db = getDb();
  return db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterUsername: users.username,
      reporterEmail: users.email,
      postId: sql<string>`case
        when ${reports.targetType} = 'post' then ${reports.targetId}::text
        else coalesce((select ${replies.postId}::text from ${replies} where ${replies.id} = ${reports.targetId}), ${reports.targetId}::text)
      end`,
    })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .orderBy(desc(reports.createdAt));
}

export async function getAdminContent() {
  await requireAdmin();
  const db = getDb();
  const [postRows, replyRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        isAnonymous: posts.isAnonymous,
        createdAt: posts.createdAt,
        hiddenAt: posts.hiddenAt,
        hiddenBy: posts.hiddenBy,
        authorUsername: users.username,
        authorEmail: users.email,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .orderBy(desc(posts.createdAt)),
    db
      .select({
        id: replies.id,
        postId: replies.postId,
        body: replies.body,
        isAnonymous: replies.isAnonymous,
        createdAt: replies.createdAt,
        hiddenAt: replies.hiddenAt,
        hiddenBy: replies.hiddenBy,
        authorUsername: users.username,
        authorEmail: users.email,
      })
      .from(replies)
      .innerJoin(users, eq(users.id, replies.authorId))
      .orderBy(desc(replies.createdAt)),
  ]);

  return { posts: postRows, replies: replyRows };
}

export async function hidePostAsAdmin(postId: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(posts)
    .set({ hiddenAt: new Date(), hiddenBy: "admin" })
    .where(eq(posts.id, postId));
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/admin");
}

export async function restorePostAsAdmin(postId: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(posts)
    .set({ hiddenAt: null, hiddenBy: null })
    .where(eq(posts.id, postId));
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/admin");
}

export async function hideReplyAsAdmin(replyId: string) {
  await requireAdmin();
  const db = getDb();
  const [reply] = await db.select().from(replies).where(eq(replies.id, replyId)).limit(1);
  if (!reply) return;
  await db
    .update(replies)
    .set({ hiddenAt: new Date(), hiddenBy: "admin" })
    .where(eq(replies.id, replyId));
  revalidatePath(`/posts/${reply.postId}`);
  revalidatePath("/admin");
}

export async function restoreReplyAsAdmin(replyId: string) {
  await requireAdmin();
  const db = getDb();
  const [reply] = await db.select().from(replies).where(eq(replies.id, replyId)).limit(1);
  if (!reply) return;
  await db
    .update(replies)
    .set({ hiddenAt: null, hiddenBy: null })
    .where(eq(replies.id, replyId));
  revalidatePath(`/posts/${reply.postId}`);
  revalidatePath("/admin");
}

export async function resolveReportAction(reportId: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(reports)
    .set({ status: "resolved", resolvedAt: new Date() })
    .where(eq(reports.id, reportId));
  revalidatePath("/admin");
}

export async function banUserAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return;
  const db = getDb();
  await db.update(users).set({ bannedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin");
}

export async function unbanUserAction(userId: string) {
  await requireAdmin();
  const db = getDb();
  await db.update(users).set({ bannedAt: null }).where(eq(users.id, userId));
  revalidatePath("/admin");
}
