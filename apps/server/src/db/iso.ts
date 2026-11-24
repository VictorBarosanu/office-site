// apps/server/src/db/iso.ts — Postgres gives back a Date, the contract wants ISO text
// (2026-11-25T08:00:00.000Z): every query that answers a row turns one into the other here

export type Iso<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

export function iso<T extends object>(row: T): Iso<T> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ])
  ) as Iso<T>;
}
