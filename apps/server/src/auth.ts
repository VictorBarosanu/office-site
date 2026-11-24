// apps/server/src/auth.ts — Better Auth: the sign-in, the session row and the cookie, by the library
// It reads BETTER_AUTH_SECRET (signs the cookie) and BETTER_AUTH_URL (its own address) from .env
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { account, session, users, verification } from "./db/schema";

// the web app: the one other origin Better Auth answers, and where its links send people
export const WEB = "http://localhost:5173";

export const auth = betterAuth({
  // our own tables, under Better Auth's names: its "user" is our users
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { account, session, user: users, verification },
  }),
  emailAndPassword: {
    // still no open sign-up: the seed and an admin add people (week 7)
    disableSignUp: true,
    enabled: true,
    // week 7's hashes keep working: Bun.password (argon2id), not Better Auth's scrypt
    password: {
      hash: (password) => Bun.password.hash(password),
      verify: ({ hash, password }) => Bun.password.verify(password, hash),
    },
  },
  trustedOrigins: [WEB],
  user: {
    additionalFields: {
      // the contract's Role; input: false, so nobody can send their own
      role: { input: false, type: ["admin", "field"] },
    },
  },
});
