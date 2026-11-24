// apps/server/src/db/users.ts — the queries for users; routes call these functions
import type { NewUser } from "@office/shared";
import { asc, eq, getTableColumns } from "drizzle-orm";
import type { Role, User } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { users } from "./schema";

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

// the user alone: no credential account, so no password works until they set one
export async function createUser(newUser: NewUser): Promise<User> {
  const [created] = await db.insert(users).values(newUser).returning(user);
  if (!created) {
    throw new Error("INSERT … RETURNING gave back no row");
  }
  return iso(created);
}

// an invitation that could not be sent takes its user back with it
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
