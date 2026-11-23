// apps/web/src/routes/sign-in.tsx — the page at /sign-in, the one page open to everybody
import { fieldErrors, SignIn } from "@office/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { User } from "field-app-contract/contract";
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
import { ApiError, postJson } from "../api";
import { meQuery } from "../queries";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
  // ?redirect=/buildings: where to go back to; only a path in this app: "/x" yes,
  // "//evil.example" (another site) and "/\evil" (browsers read \ as /) no
  validateSearch: z.object({
    redirect: z
      .string()
      .regex(/^\/(?![/\\])/)
      .optional()
      .catch(undefined),
  }),
});

type Errors = Partial<Record<string, string[]>>;
const errorsOf = (messages: string[] | undefined) =>
  messages?.map((message) => ({ message }));

function SignInPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Errors>({});
  const signIn = useMutation({
    mutationFn: (body: SignIn) => postJson<User>("/api/auth/sign-in", body),
    onError: (error) =>
      setErrors(error instanceof ApiError ? error.errors : {}),
    onSuccess: async (user) => {
      // a fresh cache for this user, who is "me" from now on
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, user);
      await navigate({ href: redirect ?? "/" });
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = SignIn.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    signIn.mutate(result.data);
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="font-semibold text-2xl">Sign in</h1>
          </CardTitle>
          <CardDescription>
            The office, for admins and field workers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            <Field data-invalid={errors.email !== undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                aria-invalid={errors.email !== undefined}
                autoComplete="username"
                id="email"
                name="email"
                type="email"
              />
              <FieldError errors={errorsOf(errors.email)} />
            </Field>
            <Field data-invalid={errors.password !== undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                aria-invalid={errors.password !== undefined}
                autoComplete="current-password"
                id="password"
                name="password"
                type="password"
              />
              <FieldError errors={errorsOf(errors.password)} />
            </Field>
            {signIn.error ? (
              <p className="text-destructive text-sm" role="alert">
                {signIn.error.message}
              </p>
            ) : null}
            <Button disabled={signIn.isPending} type="submit">
              {signIn.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
