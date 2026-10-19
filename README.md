# office

The office side of the building survey: a Bun workspace.

- `apps/server` — Hono: the pages from lab 2 and `/api/entrances`
- `apps/web` — React + Vite: the entrance list and its form
- `packages/shared` — `@office/shared`: the zod schema and the types both sides use

## Run it

```bash
bun install          # once, from the root: every workspace, one bun.lock
bun run dev:server   # http://localhost:3000
bun run dev:web      # http://localhost:5173 (a second terminal)
bun run check        # Ultracite (Biome): format + lint
```
