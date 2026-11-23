// apps/server/src/db/users.ts — the queries for users; routes call these functions

import type { NewUser } from "@office/shared";
import { asc, eq } from "drizzle-orm";
import type { Role, User } from "field-app-contract/contract";
import { db } from "../db";
import { account, users } from "./schema";

// everyone, or only the admins or only the field workers
export function listUsers(role?: Role): User[] {
  return db
    .select()
    .from(users)
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(asc(users.name))
    .all();
}

// the user and their credential account, together or not at all; hash: Bun.password's
export function createUser(
  { password: _password, ...user }: NewUser,
  hash: string
): User {
  return db.transaction((tx) => {
    const created = tx.insert(users).values(user).returning().get();
    tx.insert(account)
      .values({
        accountId: created.id,
        password: hash,
        providerId: "credential",
        userId: created.id,
      })
      .run();
    return created;
  });
}
