// apps/server/src/github.test.ts — GitHub sign-in, with GitHub played by the test: no secret, no network
import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { WEB } from "./auth";
import { db } from "./db";
import { account, users } from "./db/schema";
import app from "./index";
import {
  ANDREI,
  cookieOf,
  IRINA,
  MARIA,
  PASSWORD,
  postJson,
  verifyEveryone,
} from "./testing";

// who GitHub says the person is: their GitHub id, their email, and whether GitHub verified it
let githubEmail = "";
let githubId = 0;
let githubVerified = true;

// GitHub's three answers: the token for the code, the profile, the emails
const realFetch = globalThis.fetch;
const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((
  input: string | URL | Request,
  init?: RequestInit
) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (url.startsWith("https://github.com/login/oauth/access_token")) {
    return Promise.resolve(
      Response.json({
        access_token: "gho_test",
        scope: "user:email",
        token_type: "bearer",
      })
    );
  }
  if (url === "https://api.github.com/user") {
    return Promise.resolve(
      Response.json({
        avatar_url: null,
        email: githubEmail,
        id: githubId,
        login: "octo",
        name: "Octo",
      })
    );
  }
  if (url === "https://api.github.com/user/emails") {
    return Promise.resolve(
      Response.json([
        { email: githubEmail, primary: true, verified: githubVerified },
      ])
    );
  }
  return realFetch(input, init);
}) as typeof fetch);

afterAll(() => fetchSpy.mockRestore());

// the button's two requests: start (Better Auth answers GitHub's URL), then GitHub's redirect back
async function signInWithGitHub(
  email: string,
  { requestSignUp = false, verified = true } = {}
) {
  githubEmail = email;
  githubId += 1; // another GitHub account each time
  githubVerified = verified;
  const start = await app.request(
    "/api/auth/sign-in/social",
    postJson({
      callbackURL: `${WEB}/`,
      errorCallbackURL: `${WEB}/sign-in`,
      provider: "github",
      ...(requestSignUp ? { requestSignUp } : {}),
    })
  );
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state") ?? "";
  return app.request(
    `/api/auth/callback/github?code=test-code&state=${state}`,
    {
      headers: { Cookie: cookieOf(start) },
    }
  );
}

// refused: back to the sign-in page with Better Auth's reason, and no session
function expectRefused(res: Response, reason: string) {
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(`${WEB}/sign-in?error=${reason}`);
  expect(res.headers.get("set-cookie") ?? "").not.toContain("session_token=");
}

beforeAll(async () => {
  await migrate();
  await seed(PASSWORD);
  await verifyEveryone();
});

test("a GitHub email no user has is refused: no user, no session", async () => {
  expectRefused(
    await signInWithGitHub("stranger@example.com"),
    "signup_disabled"
  );
  expect(
    await db.select().from(users).where(eq(users.email, "stranger@example.com"))
  ).toHaveLength(0);
});

test("asking for a sign-up out loud is refused the same way (disableSignUp)", async () => {
  expectRefused(
    await signInWithGitHub("stranger@example.com", { requestSignUp: true }),
    "signup_disabled"
  );
  expect(
    await db.select().from(users).where(eq(users.email, "stranger@example.com"))
  ).toHaveLength(0);
});

test("a GitHub email that matches a verified user signs that user in, and links GitHub", async () => {
  const res = await signInWithGitHub(ANDREI);
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe(`${WEB}/`);
  const me = await app.request("/api/auth/get-session", {
    headers: { Cookie: cookieOf(res) },
  });
  expect(((await me.json()) as { user: { email: string } }).user.email).toBe(
    ANDREI
  );
  const [andrei] = await db.select().from(users).where(eq(users.email, ANDREI));
  const linked = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.userId, andrei?.id ?? ""),
        eq(account.providerId, "github")
      )
    );
  expect(linked).toHaveLength(1);
});

test("a match on an address not verified here is refused too", async () => {
  await db
    .update(users)
    .set({ emailVerified: false })
    .where(eq(users.email, MARIA));
  expectRefused(await signInWithGitHub(MARIA), "account_not_linked");
});

test("a match on an address GitHub has not verified is refused", async () => {
  // Irina is verified here; this GitHub account only claims her address
  expectRefused(
    await signInWithGitHub(IRINA, { verified: false }),
    "account_not_linked"
  );
});
