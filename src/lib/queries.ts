import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, replies, users, votes } from "@/db/schema";
import type { AppUser } from "@/lib/session";

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorUsername: string;
  replyCount: number;
  voteCount: number;
  viewerVoted: boolean;
};

export type ThreadReply = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  hiddenAt: Date | null;
  hiddenBy: string | null;
  authorId: string;
  authorUsername: string;
  voteCount: number;
  viewerVoted: boolean;
  children: ThreadReply[];
};

export type ThreadPost = FeedPost & {
  hiddenAt: Date | null;
  hiddenBy: string | null;
};

function toCount(value: unknown) {
  return Number(value ?? 0);
}

export async function getFeedPosts(viewer?: AppUser | null): Promise<FeedPost[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      isAnonymous: posts.isAnonymous,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorUsername: users.username,
      replyCount: sql<number>`(
        select count(*) from ${replies}
        where ${replies.postId} = ${posts.id}
          and ${replies.hiddenAt} is null
      )`,
      voteCount: sql<number>`(
        select count(*) from ${votes}
        where ${votes.postId} = ${posts.id}
      )`,
      viewerVoted: viewer
        ? sql<boolean>`exists (
            select 1 from ${votes}
            where ${votes.postId} = ${posts.id}
              and ${votes.userId} = ${viewer.id}
          )`
        : sql<boolean>`false`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(isNull(posts.hiddenAt))
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    ...row,
    replyCount: toCount(row.replyCount),
    voteCount: toCount(row.voteCount),
    viewerVoted: Boolean(row.viewerVoted),
  }));
}

export async function getThread(
  postId: string,
  viewer?: AppUser | null,
  opts?: { includeHidden?: boolean },
) {
  const db = getDb();
  const includeHidden = Boolean(opts?.includeHidden);

  const [postRows, replyRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        isAnonymous: posts.isAnonymous,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        hiddenAt: posts.hiddenAt,
        hiddenBy: posts.hiddenBy,
        authorId: posts.authorId,
        authorUsername: users.username,
        replyCount: sql<number>`(
          select count(*) from ${replies}
          where ${replies.postId} = ${posts.id}
            and ${includeHidden ? sql`true` : sql`${replies.hiddenAt} is null`}
        )`,
        voteCount: sql<number>`(
          select count(*) from ${votes}
          where ${votes.postId} = ${posts.id}
        )`,
        viewerVoted: viewer
          ? sql<boolean>`exists (
              select 1 from ${votes}
              where ${votes.postId} = ${posts.id}
                and ${votes.userId} = ${viewer.id}
            )`
          : sql<boolean>`false`,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.id, postId))
      .limit(1),
    db
      .select({
        id: replies.id,
        postId: replies.postId,
        parentId: replies.parentId,
        body: replies.body,
        isAnonymous: replies.isAnonymous,
        createdAt: replies.createdAt,
        updatedAt: replies.updatedAt,
        hiddenAt: replies.hiddenAt,
        hiddenBy: replies.hiddenBy,
        authorId: replies.authorId,
        authorUsername: users.username,
        voteCount: sql<number>`(
          select count(*) from ${votes}
          where ${votes.replyId} = ${replies.id}
        )`,
        viewerVoted: viewer
          ? sql<boolean>`exists (
              select 1 from ${votes}
              where ${votes.replyId} = ${replies.id}
                and ${votes.userId} = ${viewer.id}
            )`
          : sql<boolean>`false`,
      })
      .from(replies)
      .innerJoin(users, eq(users.id, replies.authorId))
      .where(
        includeHidden
          ? eq(replies.postId, postId)
          : and(eq(replies.postId, postId), isNull(replies.hiddenAt)),
      )
      .orderBy(desc(replies.createdAt)),
  ]);

  const post = postRows[0];
  if (!post) return null;
  if (post.hiddenAt && !includeHidden) return null;

  const threadPost: ThreadPost = {
    ...post,
    replyCount: toCount(post.replyCount),
    voteCount: toCount(post.voteCount),
    viewerVoted: Boolean(post.viewerVoted),
  };

  const nodes: ThreadReply[] = replyRows.map((row) => ({
    ...row,
    voteCount: toCount(row.voteCount),
    viewerVoted: Boolean(row.viewerVoted),
    children: [],
  }));

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const roots: ThreadReply[] = [];

  for (const node of nodes) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return { post: threadPost, replies: roots };
}
