// apps/server/src/db/auth.ts — the queries for signing in
import { and, eq, gt } from "drizzle-orm";
import type { User } from "field-app-contract/contract";
import { db } from "../db";
import { account, session, users } from "./schema";

// the user with this email and their password hash, or undefined
export function findCredential(
  email: string
): { hash: string | null; user: User } | undefined {
  return db
    .select({ hash: account.password, user: users })
    .from(users)
    .innerJoin(account, eq(account.userId, users.id))
    .where(and(eq(users.email, email), eq(account.providerId, "credential")))
    .get();
}

// a new row in session: the token goes in the cookie, the rest stays here
export function createSession(values: {
  expiresAt: Date;
  ipAddress: string | null;
  token: string;
  userAgent: string | null;
  userId: string;
}) {
  db.insert(session).values(values).run();
}

// the user whose session holds this token, while it has not expired
export function findSessionUser(token: string): User | undefined {
  return db
    .select({ user: users })
    .from(session)
    .innerJoin(users, eq(users.id, session.userId))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
    .get()?.user;
}

export function deleteSession(token: string) {
  db.delete(session).where(eq(session.token, token)).run();
}
