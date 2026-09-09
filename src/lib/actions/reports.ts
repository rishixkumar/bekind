"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts, replies, reports } from "@/db/schema";
import { bannedMessage, requireActiveUser } from "@/lib/session";
import { reportSchema, type ActionState } from "@/lib/validations";

export async function reportContentAction(
  targetType: "post" | "reply",
  targetId: string,
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

  const parsed = reportSchema.safeParse({
    reason: String(formData.get("reason") ?? ""),
    details: String(formData.get("details") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pick a reason." };
  }

  const db = getDb();
  if (targetType === "post") {
    const [post] = await db.select().from(posts).where(eq(posts.id, targetId)).limit(1);
    if (!post) return { error: "Post not found." };
  } else {
    const [reply] = await db
      .select()
      .from(replies)
      .where(eq(replies.id, targetId))
      .limit(1);
    if (!reply) return { error: "Reply not found." };
  }

  const [already] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, user.id),
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
        eq(reports.status, "open"),
      ),
    )
    .limit(1);

  if (already) {
    return { error: "You already reported this." };
  }

  await db.insert(reports).values({
    reporterId: user.id,
    targetType,
    targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  revalidatePath("/admin");
  return {};
}
