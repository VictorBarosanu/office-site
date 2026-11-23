// apps/server/src/db/auth.ts — the queries for signing in
import { and, eq } from "drizzle-orm";
import type { User } from "field-app-contract/contract";
import { db } from "../db";
import { account, users } from "./schema";

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

export function getUser(id: string): User | undefined {
  return db.select().from(users).where(eq(users.id, id)).get();
}
