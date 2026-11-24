// apps/server/src/verify.test.ts — email verification: no session until the mailed link is opened
import { beforeAll, expect, test } from "bun:test";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import app from "./index";
import { sent } from "./mail";
import { MARIA, PASSWORD, signIn } from "./testing";

const LINK = /http\S+/;

// the last mail to this address, and the link in it
const linkTo = (email: string) => {
  const mail = sent.findLast((m) => m.to === email);
  return mail?.text.match(LINK)?.[0] ?? "";
};

beforeAll(async () => {
  await migrate();
  // the seed's users start unverified, as in development
  await seed(PASSWORD);
});

test("a wrong password is still a 401, and mails nothing", async () => {
  const before = sent.length;
  expect((await signIn(MARIA, "not-the-password")).status).toBe(401);
  expect(sent).toHaveLength(before);
});

test("an unverified user is refused, and mailed a link; the link verifies and signs in", async () => {
  const refused = await signIn(MARIA);
  expect(refused.status).toBe(403);
  expect(await refused.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  expect(refused.headers.get("set-cookie")).toBeNull();

  const link = new URL(linkTo(MARIA));
  expect(link.pathname).toBe("/api/auth/verify-email");
  // opening the link: Better Auth marks the address verified, signs in, redirects
  const opened = await app.request(link.pathname + link.search);
  expect(opened.status).toBe(302);
  expect(opened.headers.get("set-cookie")).toContain(
    "better-auth.session_token="
  );

  expect((await signIn(MARIA)).status).toBe(200);
});
