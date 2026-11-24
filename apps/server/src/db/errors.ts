// apps/server/src/db/errors.ts — which Postgres errors are the client's fault
// Drizzle wraps the driver's error: Postgres's own code is on its cause
const codeOf = (error: unknown) =>
  (error as { cause?: { code?: string } } | undefined)?.cause?.code;

// REFERENCES refused the write: a missing parent, or a parent with children
export function isForeignKeyError(error: unknown): boolean {
  return codeOf(error) === "23503"; // foreign_key_violation
}

// UNIQUE refused the write: the value is taken (an email, a token)
export function isUniqueError(error: unknown): boolean {
  return codeOf(error) === "23505"; // unique_violation
}
