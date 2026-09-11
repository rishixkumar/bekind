"use server";

import { count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  emailVerificationTokens,
  posts,
  replies,
  reports,
  users,
  votes,
} from "@/db/schema";
import { isAdminEmail } from "@/lib/constants";
import { requireAdmin } from "@/lib/session";
import type { DeleteUserResult } from "@/lib/validations";

export async function getAdminStats() {
  await requireAdmin();
  const db = getDb();
  const [[userCount], [loginCount], [postCount], [replyCount], [reportCount]] =
    await Promise.all([
      db.select({ n: count() }).from(users),
      db.select({ n: count() }).from(users).where(isNotNull(users.lastLoginAt)),
      db.select({ n: count() }).from(posts).where(isNull(posts.hiddenAt)),
      db.select({ n: count() }).from(replies).where(isNull(replies.hiddenAt)),
      db.select({ n: count() }).from(reports).where(eq(reports.status, "open")),
    ]);

  return {
    users: Number(userCount?.n ?? 0),
    logins: Number(loginCount?.n ?? 0),
    posts: Number(postCount?.n ?? 0),
    replies: Number(replyCount?.n ?? 0),
    openReports: Number(reportCount?.n ?? 0),
  };
}

export async function getAdminUsers() {
  await requireAdmin();
  const db = getDb();

  const postCounts = db
    .select({ authorId: posts.authorId, n: count().as("post_count") })
    .from(posts)
    .groupBy(posts.authorId)
    .as("post_counts");
  const replyCounts = db
    .select({ authorId: replies.authorId, n: count().as("reply_count") })
    .from(replies)
    .groupBy(replies.authorId)
    .as("reply_counts");

  // Only the columns the dashboard renders — password hashes have no business
  // crossing to the client. The counts feed the delete confirmation.
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      lastLoginAt: users.lastLoginAt,
      bannedAt: users.bannedAt,
      createdAt: users.createdAt,
      postCount: postCounts.n,
      replyCount: replyCounts.n,
    })
    .from(users)
    .leftJoin(postCounts, eq(postCounts.authorId, users.id))
    .leftJoin(replyCounts, eq(replyCounts.authorId, users.id))
    .orderBy(desc(users.createdAt));

  return rows.map((row) => ({
    ...row,
    postCount: Number(row.postCount ?? 0),
    replyCount: Number(row.replyCount ?? 0),
    role: (row.role === "admin" || isAdminEmail(row.email) ? "admin" : "user") as
      | "user"
      | "admin",
  }));
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

export async function deletePostAsAdmin(postId: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/");
  revalidatePath("/admin");
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

/**
 * Everything that disappears when a user is erased: their posts, every reply
 * living under those posts (whoever wrote it), their own replies elsewhere, and
 * every descendant of those replies. Postgres cascades handle the descent at
 * delete time; we spell it out here because `reports.target_id` is a bare uuid
 * with no foreign key, so nothing would clean those rows up for us.
 */
function doomedContent(userId: string) {
  return sql`
    with recursive doomed_posts as (
      select id from ${posts} where author_id = ${userId}
    ),
    doomed_replies as (
      select id, parent_id
        from ${replies}
       where author_id = ${userId}
          or post_id in (select id from doomed_posts)
      union
      select child.id, child.parent_id
        from ${replies} child
        join doomed_replies parent on child.parent_id = parent.id
    )
  `;
}

/**
 * Hard-deletes a user so the email and username are free to claim again.
 *
 * Ordered deletes inside one batch rather than new `on delete cascade`
 * constraints: production shares this database, and rewriting foreign keys on
 * live tables is a bigger risk than a transaction we control. `db.batch` on the
 * Neon HTTP driver ships the statements as a single transaction, so a failure
 * anywhere leaves the account intact.
 */
export async function deleteUserAction(
  userId: string,
  confirmUsername: string,
): Promise<DeleteUserResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "You can't delete the account you're signed in with." };
  }

  const db = getDb();
  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) return { error: "That account is already gone." };
  if (target.role === "admin" || isAdminEmail(target.email)) {
    return { error: "Admin accounts can't be deleted from here." };
  }
  if (confirmUsername.trim() !== target.username) {
    return { error: `Type ${target.username} exactly to confirm.` };
  }

  const tally = await db.execute<{
    posts: number;
    replies: number;
    votes: number;
    reports: number;
    tokens: number;
  }>(sql`
    ${doomedContent(userId)}
    select
      (select count(*) from doomed_posts)::int as posts,
      (select count(*) from doomed_replies)::int as replies,
      (select count(*) from ${votes} where user_id = ${userId})::int as votes,
      (select count(*) from ${reports} where reporter_id = ${userId})::int as reports,
      (select count(*) from ${emailVerificationTokens} where user_id = ${userId})::int as tokens
  `);
  const counts = tally.rows[0];

  await db.batch([
    db.execute(sql`
      ${doomedContent(userId)}
      delete from ${reports}
       where (target_type = 'post' and target_id in (select id from doomed_posts))
          or (target_type = 'reply' and target_id in (select id from doomed_replies))
    `),
    db.delete(reports).where(eq(reports.reporterId, userId)),
    db.delete(votes).where(eq(votes.userId, userId)),
    // Their replies on other people's posts; children cascade off parent_id.
    db.delete(replies).where(eq(replies.authorId, userId)),
    // Their posts; every reply and vote underneath cascades away.
    db.delete(posts).where(eq(posts.authorId, userId)),
    db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId)),
    db.delete(users).where(eq(users.id, userId)),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/posts/[id]", "page");

  return {
    deleted: {
      username: target.username,
      posts: Number(counts?.posts ?? 0),
      replies: Number(counts?.replies ?? 0),
      votes: Number(counts?.votes ?? 0),
      reports: Number(counts?.reports ?? 0),
      tokens: Number(counts?.tokens ?? 0),
    },
  };
}
