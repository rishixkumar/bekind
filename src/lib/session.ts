import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { SITE_NAME, isAdminEmail } from "@/lib/constants";

export type AppUser = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isBanned: boolean;
  isVerified: boolean;
};

export async function getAppUser(): Promise<AppUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) return null;

  const isAdmin = row.role === "admin" || isAdminEmail(row.email);

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    isAdmin,
    isBanned: Boolean(row.bannedAt),
    // Admins are never gated, so a non-GT ADMIN_EMAIL can still moderate.
    isVerified: isAdmin || Boolean(row.emailVerifiedAt),
  };
}

export async function requireUser() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireActiveUser() {
  const user = await requireUser();
  if (user.isBanned) {
    throw new Error("BANNED");
  }
  if (!user.isVerified) {
    throw new Error("UNVERIFIED");
  }
  return user;
}

/**
 * Write actions all funnel through requireActiveUser; this turns the thrown
 * gate into copy for the form, and rethrows anything it doesn't own.
 */
export function writeGateMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (error.message === "BANNED") return bannedMessage();
  if (error.message === "UNVERIFIED") return unverifiedMessage();
  return null;
}

export async function requireAdmin() {
  const user = await getAppUser();
  if (!user?.isAdmin) notFound();
  return user;
}

export function bannedMessage() {
  return `Your account can still read ${SITE_NAME}, but posting is paused.`;
}

export function unverifiedMessage() {
  return "Confirm your Georgia Tech email before posting — check your inbox for the code.";
}
