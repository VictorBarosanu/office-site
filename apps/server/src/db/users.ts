// apps/server/src/db/users.ts — the queries for users; routes call these functions
import type { NewUser } from "@office/shared";
import { asc, eq } from "drizzle-orm";
import type { Role, User } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { account, users } from "./schema";

// everyone, or only the admins or only the field workers
export async function listUsers(role?: Role): Promise<User[]> {
  const rows = await db
    .select()
    .from(users)
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(asc(users.name));
  return rows.map(iso);
}

// the user and their credential account, together or not at all; hash: Bun.password's
export function createUser(
  { password: _password, ...user }: NewUser,
  hash: string
): Promise<User> {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(users).values(user).returning();
    if (!created) {
      throw new Error("INSERT … RETURNING gave back no row");
    }
    await tx.insert(account).values({
      accountId: created.id,
      password: hash,
      providerId: "credential",
      userId: created.id,
    });
    return iso(created);
  });
}
