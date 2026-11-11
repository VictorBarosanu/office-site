// apps/server/src/db/errors.ts — SQLite constraint checks for route handlers
export function isForeignKeyError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }
  const { code, cause } = err as {
    code?: unknown;
    cause?: { code?: unknown };
  };
  return (
    code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
    cause?.code === "SQLITE_CONSTRAINT_FOREIGNKEY"
  );
}
