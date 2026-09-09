import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/constants";

export type AppUser = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isBanned: boolean;
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

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    isAdmin: row.role === "admin" || isAdminEmail(row.email),
    isBanned: Boolean(row.bannedAt),
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
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

export function bannedMessage() {
  return "Your account can still read Be Kind, but posting is paused.";
}
