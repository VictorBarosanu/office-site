// apps/web/src/api.ts — where the server is, and one way to read JSON from it

// VITE_API_URL=http://localhost:3005 bun run dev:web points the app elsewhere
export const API: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path}: ${res.status}`);
  }
  return res.json();
}
