// apps/server/src/db/users.ts — the queries for users; routes call these functions
import type { NewUser } from "@office/shared";
import { asc, eq, getTableColumns } from "drizzle-orm";
import type { Role, User } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { account, users } from "./schema";

// the contract's columns: never Better Auth's own two (emailVerified, image)
const {
  emailVerified: _emailVerified,
  image: _image,
  ...user
} = getTableColumns(users);

// everyone, or only the admins or only the field workers
export async function listUsers(role?: Role): Promise<User[]> {
  const rows = await db
    .select(user)
    .from(users)
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(asc(users.name));
  return rows.map(iso);
}

// the user and their credential account, together or not at all; hash: Bun.password's
export function createUser(
  { password: _password, ...newUser }: NewUser,
  hash: string
): Promise<User> {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(users).values(newUser).returning(user);
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
