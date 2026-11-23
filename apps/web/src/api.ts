// apps/web/src/api.ts — where the server is, and one way to read JSON from it

// VITE_API_URL=http://localhost:3005 bun run dev:web points the app elsewhere
export const API: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// every error is a problem+json: detail says what went wrong; a 400 also has
// errors: { field: [messages] }, the messages the form shows beside each field
export class ApiError extends Error {
  readonly errors: Partial<Record<string, string[]>>;
  readonly status: number;
  constructor(
    message: string,
    errors: Partial<Record<string, string[]>>,
    status: number
  ) {
    super(message);
    this.errors = errors;
    this.status = status;
  }
}

// the problem+json of a failed response, as an ApiError
export async function apiError(res: Response, what: string) {
  const data = await res.json().catch(() => ({}));
  return new ApiError(
    data.detail ?? `${what}: ${res.status}`,
    data.errors ?? {},
    res.status
  );
}

export async function getJson<T>(path: string): Promise<T> {
  // include: send the session cookie, though the API is on another port
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) {
    throw await apiError(res, `GET ${path}`);
  }
  return res.json();
}

// the server deletes the session and clears the cookie; 204, no body to read
export async function signOut(): Promise<void> {
  await fetch(`${API}/api/auth/sign-out`, {
    credentials: "include",
    method: "POST",
  });
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!res.ok) {
    throw await apiError(res, `POST ${path}`);
  }
  return res.json();
}
