import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Sign-in with Spotify was removed: Spotify only lets an app in development
// mode sign in 25 hand-picked users, and lifting that needs an established
// business with 250k monthly users. Playlists come in by link instead (see
// src/lib/music/link-import.ts), which needs no Spotify account at all.

/** Google sign-in is only offered when its keys are configured. */
export const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// A username from an email or name: lowercase letters, numbers, - and _,
// 3 to 20 characters, made unique with a short number suffix if needed.
async function uniqueUsername(seed: string): Promise<string> {
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "")
      .slice(0, 20) || "listener";
  const padded = base.length < 3 ? `${base}${"user".slice(0, 3 - base.length)}` : base;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? padded : `${padded.slice(0, 16)}${Math.floor(1000 + Math.random() * 9000)}`;
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `listener${Date.now().toString(36)}`;
}

// The stock Prisma adapter creates users with `name` and `image`, which this
// schema doesn't have, and without the required unique `username`, so the
// first Google sign-in failed. Map those fields onto ours instead.
function remixdAdapter(): Adapter {
  const base = PrismaAdapter(db) as Adapter;
  return {
    ...base,
    async createUser(data: AdapterUser) {
      const username = await uniqueUsername(data.email.split("@")[0] || data.name || "");
      const user = await db.user.create({
        data: {
          email: data.email,
          username,
          displayName: data.name ?? null,
          emailVerified: data.emailVerified ?? null,
          profile: { create: { profilePictureUrl: data.image ?? null } },
        },
      });
      return { id: user.id, email: user.email, emailVerified: user.emailVerified, name: user.displayName, image: data.image ?? null };
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: remixdAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // slow down password guessing: per address and per account
        const email = String(credentials.email).toLowerCase();
        const byIp = rateLimit(`login:ip:${getClientIp(request)}`, { limit: 20, windowSec: 15 * 60 });
        const byEmail = rateLimit(`login:email:${email}`, { limit: 10, windowSec: 15 * 60 });
        if (!byIp.success || !byEmail.success) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          image: null,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Google verifies email addresses, so someone who signed up with
            // email + password can also sign in with Google on the same
            // address instead of hitting "account not linked".
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    // Sign-up with email + password doesn't prove the address belongs to the
    // person. If someone else pre-registered your address, then you sign in
    // with Google (which does prove it) and the accounts are linked, their
    // password would still open your account. So when Google is linked to an
    // account whose address was never verified, that password is removed.
    async linkAccount({ user, account }) {
      if (account.provider !== "google" || !user.id) return;
      const existing = await db.user.findUnique({ where: { id: user.id }, select: { emailVerified: true, passwordHash: true } });
      if (existing && !existing.emailVerified) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date(), ...(existing.passwordHash ? { passwordHash: null } : {}) },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          select: { id: true, username: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.username = token.username;
        user.role = token.role;
      }
      return session;
    },
  },
});
