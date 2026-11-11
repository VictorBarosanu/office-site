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

// a 400 from the server carries { errors: { field: [messages] } }: keep them
export class ApiError extends Error {
  readonly errors: Partial<Record<string, string[]>>;
  constructor(message: string, errors: Partial<Record<string, string[]>>) {
    super(message);
    this.errors = errors;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(`POST ${path}: ${res.status}`, data.errors ?? {});
  }
  return data;
}
