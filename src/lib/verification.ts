import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { sendEmail, verificationEmail } from "@/lib/email";

export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 15;
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function codesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function generateCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export type IssueResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterSeconds?: number };

/**
 * Mints a fresh code, retires any earlier ones, and mails it. Callers should
 * treat a failed send as a failed issue so the user is told to try again
 * rather than left waiting on mail that never went out.
 */
export async function issueVerificationCode(
  userId: string,
  email: string,
  { enforceRateLimit = true }: { enforceRateLimit?: boolean } = {},
): Promise<IssueResult> {
  const db = getDb();
  const now = new Date();

  if (enforceRateLimit) {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recent = await db
      .select({ createdAt: emailVerificationTokens.createdAt })
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          gt(emailVerificationTokens.createdAt, hourAgo),
        ),
      )
      .orderBy(desc(emailVerificationTokens.createdAt));

    if (recent.length >= MAX_SENDS_PER_HOUR) {
      return {
        ok: false,
        reason: "That's a lot of codes in one hour. Try again later.",
      };
    }

    const last = recent[0]?.createdAt;
    if (last) {
      const elapsed = (now.getTime() - last.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return {
          ok: false,
          reason: "Hang on a moment before asking for another code.",
          retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
        };
      }
    }
  }

  // Retire outstanding codes so only the newest one works.
  await db
    .update(emailVerificationTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        isNull(emailVerificationTokens.consumedAt),
      ),
    );

  const code = generateCode();
  await db.insert(emailVerificationTokens).values({
    userId,
    codeHash: hashCode(code),
    expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000),
  });

  const sent = await sendEmail({
    to: email,
    ...verificationEmail(code, CODE_TTL_MINUTES),
  });

  if (!sent.ok) {
    return { ok: false, reason: `Couldn't send the code. ${sent.reason}` };
  }

  return { ok: true };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export async function verifyCode(userId: string, code: string): Promise<VerifyResult> {
  const db = getDb();
  const now = new Date();
  const cleaned = code.replace(/\D/g, "");

  const [token] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        isNull(emailVerificationTokens.consumedAt),
      ),
    )
    .orderBy(desc(emailVerificationTokens.createdAt))
    .limit(1);

  if (!token) {
    return { ok: false, reason: "That code has expired. Ask for a new one." };
  }

  if (token.expiresAt <= now) {
    await db
      .update(emailVerificationTokens)
      .set({ consumedAt: now })
      .where(eq(emailVerificationTokens.id, token.id));
    return { ok: false, reason: "That code has expired. Ask for a new one." };
  }

  if (token.attempts >= MAX_CODE_ATTEMPTS) {
    await db
      .update(emailVerificationTokens)
      .set({ consumedAt: now })
      .where(eq(emailVerificationTokens.id, token.id));
    return { ok: false, reason: "Too many tries. Ask for a new code." };
  }

  if (!codesMatch(hashCode(cleaned), token.codeHash)) {
    await db
      .update(emailVerificationTokens)
      .set({ attempts: token.attempts + 1 })
      .where(eq(emailVerificationTokens.id, token.id));
    const left = MAX_CODE_ATTEMPTS - (token.attempts + 1);
    return {
      ok: false,
      reason:
        left > 0
          ? `That code doesn't match. ${left} ${left === 1 ? "try" : "tries"} left.`
          : "Too many tries. Ask for a new code.",
    };
  }

  await db
    .update(emailVerificationTokens)
    .set({ consumedAt: now })
    .where(eq(emailVerificationTokens.id, token.id));

  await db
    .update(users)
    .set({ emailVerifiedAt: now })
    .where(eq(users.id, userId));

  return { ok: true };
}
