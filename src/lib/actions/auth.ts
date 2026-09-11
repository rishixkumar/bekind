"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { eq, or } from "drizzle-orm";
import { signIn, signOut } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/constants";
import { loginSchema, signUpSchema, type ActionState } from "@/lib/validations";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function safeInternalPath(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

function isDefaultHome(path: string) {
  return path === "/" || path === "/login" || path === "/signup";
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password"),
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
  const existing = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(
      or(
        eq(users.email, parsed.data.email),
        eq(users.username, parsed.data.username),
      ),
    )
    .limit(1);

  if (existing[0]?.email === parsed.data.email) {
    return { error: "An account with that email already exists." };
  }
  if (existing[0]?.username === parsed.data.username) {
    return { error: "That username is taken." };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const admin = isAdminEmail(parsed.data.email);
  await db.insert(users).values({
    email: parsed.data.email,
    username: parsed.data.username,
    passwordHash,
    role: admin ? "admin" : "user",
    lastLoginAt: new Date(),
    // GT-format email is enough for now; no mailbox code step.
    emailVerifiedAt: new Date(),
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: admin ? "/admin" : "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }

  const next = safeInternalPath(formString(formData, "next"));
  const redirectTo =
    isAdminEmail(parsed.data.email) && isDefaultHome(next) ? "/admin" : next;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password doesn’t match." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
