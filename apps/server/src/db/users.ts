// apps/server/src/db/users.ts — the queries for users; routes call these functions
import { asc, eq } from "drizzle-orm";
import type { Role, User } from "field-app-contract/contract";
import { db } from "../db";
import { users } from "./schema";

// everyone, or only the admins or only the field workers
export function listUsers(role?: Role): User[] {
  return db
    .select()
    .from(users)
    .where(role ? eq(users.role, role) : undefined)
    .orderBy(asc(users.name))
    .all();
}
