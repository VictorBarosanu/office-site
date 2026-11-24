// apps/web/src/routes/set-password.tsx — where the invitation mail's link lands: choose a password
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/set-password")({
  component: SetPasswordPage,
  // Better Auth sends ?token=… for a good link, ?error=INVALID_TOKEN for a used or old one
  validateSearch: z.object({
    error: z.string().optional().catch(undefined),
    token: z.string().optional().catch(undefined),
  }),
});

const NewPassword = z.string().min(8, "At least 8 characters");

function SetPasswordPage() {
  const { error, token } = Route.useSearch();
  // what is wrong with the typed password; "" when nothing is
  const [problem, setProblem] = useState("");
  const setPassword = useMutation({
    mutationFn: async (newPassword: string) => {
      const result = await authClient.resetPassword({ newPassword, token });
      if (result.error) {
        throw new Error("This link has expired or was used already.");
      }
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = NewPassword.safeParse(
      new FormData(e.currentTarget).get("password")
    );
    if (!result.success) {
      setProblem(result.error.issues[0]?.message ?? "Too short");
      return;
    }
    setProblem("");
    setPassword.mutate(result.data);
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="font-semibold text-2xl">Set your password</h1>
          </CardTitle>
          <CardDescription>
            An admin added you to the office. Choose the password you will sign
            in with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setPassword.isSuccess ? (
            <p className="grid gap-4" role="status">
              Your password is set and your email is verified.
              <Link className="underline" to="/sign-in">
                Sign in
              </Link>
            </p>
          ) : null}
          {error || !token ? (
            <p className="text-destructive text-sm" role="alert">
              This link has expired or was used already. Ask an admin to invite
              you again.
            </p>
          ) : null}
          {token && !error && !setPassword.isSuccess ? (
            <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
              <Field data-invalid={problem !== ""}>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <Input
                  aria-invalid={problem !== ""}
                  autoComplete="new-password"
                  id="password"
                  name="password"
                  type="password"
                />
                <FieldError
                  errors={problem ? [{ message: problem }] : undefined}
                />
              </Field>
              {setPassword.error ? (
                <p className="text-destructive text-sm" role="alert">
                  {setPassword.error.message}
                </p>
              ) : null}
              <Button disabled={setPassword.isPending} type="submit">
                {setPassword.isPending ? "Saving…" : "Set my password"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
