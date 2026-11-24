// apps/server/src/invite.test.ts — the invitation: a user with no password, who sets one from the mail
import { beforeAll, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { auth } from "./auth";
import { db } from "./db";
import { account, users } from "./db/schema";
import app from "./index";
import { sent } from "./mail";
import {
  as,
  cookieOf,
  IRINA,
  PASSWORD,
  postJson,
  signIn,
  verifyEveryone,
} from "./testing";

const LINK = /http\S+/;
const NEW = {
  email: "invited@example.com",
  name: "Ana Invitată",
  role: "field",
};

let admin: ReturnType<typeof as>;

beforeAll(async () => {
  await migrate();
  await seed(PASSWORD);
  await verifyEveryone();
  admin = as(cookieOf(await signIn(IRINA)));
});

test("an invitation creates a user with no password, and mails them a link to set one", async () => {
  const res = await admin("/api/users", postJson(NEW));
  expect(res.status).toBe(201);
  const created = (await res.json()) as { id: string };
  // no credential account: no password can work yet
  expect(
    await db.select().from(account).where(eq(account.userId, created.id))
  ).toHaveLength(0);
  expect((await signIn(NEW.email, "a-guess-at-a-password")).status).toBe(401);

  const mail = sent.findLast((m) => m.to === NEW.email);
  expect(mail?.subject).toBe("Set your password for the office");

  // the link: Better Auth checks the token and sends the browser to the web app's page
  const link = new URL(mail?.text.match(LINK)?.[0] ?? "");
  const opened = await app.request(link.pathname + link.search);
  expect(opened.status).toBe(302);
  const page = new URL(opened.headers.get("location") ?? "");
  expect(page.origin + page.pathname).toBe(
    "http://localhost:5173/set-password"
  );
  const token = page.searchParams.get("token") ?? "";

  // the page sends the new password with the token: the account is made, the address verified
  const set = await app.request(
    "/api/auth/reset-password",
    postJson({ newPassword: "my-own-password", token })
  );
  expect(set.status).toBe(200);
  const [user] = await db.select().from(users).where(eq(users.id, created.id));
  expect(user?.emailVerified).toBe(true);
  expect((await signIn(NEW.email, "my-own-password")).status).toBe(200);

  // the link works once
  const again = await app.request(
    "/api/auth/reset-password",
    postJson({ newPassword: "another-password", token })
  );
  expect(again.status).toBe(400);
});

test("an invitation that cannot be sent leaves no user behind, so the admin can try again", async () => {
  const user = {
    email: "retry@example.com",
    name: "Retry Later",
    role: "field",
  };
  // Better Auth's reset request fails once (a database error, say)
  const failing = spyOn(auth.api, "requestPasswordReset").mockRejectedValueOnce(
    new Error("the reset request failed")
  );
  expect((await admin("/api/users", postJson(user))).status).toBe(500);
  failing.mockRestore();
  expect(
    await db.select().from(users).where(eq(users.email, user.email))
  ).toHaveLength(0);
  expect((await admin("/api/users", postJson(user))).status).toBe(201);
});
