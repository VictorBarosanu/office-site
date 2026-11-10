# office

The office side of the building survey: a Bun workspace.

- `apps/server` — Hono: the pages from lab 2 and `/api/entrances`
- `apps/web` — React + Vite: the entrance list and its form
- `packages/shared` — `@office/shared`: the zod schema and the types both sides use

## Run it

```bash
bun install          # once, from the root: every workspace, one bun.lock
bun run db:migrate   # creates apps/server/data/office.sqlite; applies new migrations
bun run db:seed      # dev only: empties the tables, fills them from the contract's fixtures
bun run dev          # Turborepo: the server on http://localhost:3000 and the web on http://localhost:5173
bun run test         # Turborepo: the contract's tests and the repository test (on :memory:)
bun run typecheck    # Turborepo: the server and the web
bun run check        # Ultracite (Biome): format + lint
```

## The database

- `apps/server/src/db/schema.ts` — the tables, in TypeScript, from the contract
- `bun run db:generate` — after a schema change: drizzle-kit writes the next `apps/server/drizzle/NNNN_*.sql`; commit it, never edit one that has run
- `apps/server/src/db/` — the repository: every query, through Drizzle
- `apps/server/data/` — the database file, git-ignored