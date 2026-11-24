// apps/web/src/auth-client.ts — Better Auth's client: sign in, sign out, who is signed in
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { API } from "./api";

export const authClient = createAuthClient({
  // the API's address; the client adds /api/auth/… and sends the cookie with every call
  baseURL: API,
  // the server's extra user field, so me.role is typed here too
  plugins: [
    inferAdditionalFields({
      user: { role: { input: false, type: ["admin", "field"] } },
    }),
  ],
});
