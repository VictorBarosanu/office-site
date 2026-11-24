// apps/server/src/db/auth.ts — the queries for signing in
import { and, eq, gt } from "drizzle-orm";
import type { User } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { account, session, users } from "./schema";

// the user with this email and their password hash, or undefined
export async function findCredential(
  email: string
): Promise<{ hash: string | null; user: User } | undefined> {
  const [found] = await db
    .select({ hash: account.password, user: users })
    .from(users)
    .innerJoin(account, eq(account.userId, users.id))
    .where(and(eq(users.email, email), eq(account.providerId, "credential")));
  return found && { hash: found.hash, user: iso(found.user) };
}

// a new row in session: the token goes in the cookie, the rest stays here
export async function createSession(values: {
  expiresAt: Date;
  ipAddress: string | null;
  token: string;
  userAgent: string | null;
  userId: string;
}) {
  await db.insert(session).values(values);
}

// the user whose session holds this token, while it has not expired
export async function findSessionUser(
  token: string
): Promise<User | undefined> {
  const [found] = await db
    .select({ user: users })
    .from(session)
    .innerJoin(users, eq(users.id, session.userId))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())));
  return found && iso(found.user);
}

export async function deleteSession(token: string) {
  await db.delete(session).where(eq(session.token, token));
}
