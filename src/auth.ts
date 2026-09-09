import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/constants";
import { loginSchema } from "@/lib/validations";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        const isAdmin = user.role === "admin" || isAdminEmail(user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          isAdmin,
          isBanned: Boolean(user.bannedAt),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.isBanned = user.isBanned;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id);
      session.user.username = String(token.username);
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.isBanned = Boolean(token.isBanned);
      return session;
    },
  },
});
