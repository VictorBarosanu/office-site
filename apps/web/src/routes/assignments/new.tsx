// apps/web/src/routes/assignments/new.tsx — the page at /assignments/new: TanStack Form
import { NewRoute } from "@office/shared";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ApiError, postJson } from "../../api";
import { entrancesQuery, workersQuery } from "../../queries";

export const Route = createFileRoute("/assignments/new")({
  component: NewAssignment,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query({ ...workersQuery, staleTime: "static" }),
      context.queryClient.query({ ...entrancesQuery, staleTime: "static" }),
    ]),
});

// a field's first error, once the user has been there; the schema's message
function FieldError({
  meta,
}: {
  meta: { errors: ({ message?: string } | undefined)[]; isTouched: boolean };
}) {
  const message = meta.errors[0]?.message;
  return meta.isTouched && message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}

function NewAssignment() {
  const { data: workers } = useSuspenseQuery(workersQuery);
  const { data: entrances } = useSuspenseQuery(entrancesQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (route: NewRoute) => postJson("/api/routes", route),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      await navigate({ to: "/assignments" });
    },
  });

  const form = useForm({
    defaultValues: {
      date: "",
      entranceIds: [] as string[],
      name: "",
      workerId: "",
    },
    // the server's schema, on every change: one rule, both sides
    onSubmit: ({ value }) => create.mutateAsync(value),
    validators: { onChange: NewRoute },
  });

  return (
    <>
      <h1>New assignment</h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <>
              <label htmlFor={field.name}>Name</label>
              <input
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Old town, Thursday"
                value={field.state.value}
              />
              <FieldError meta={field.state.meta} />
            </>
          )}
        </form.Field>
        <form.Field name="date">
          {(field) => (
            <>
              <label htmlFor={field.name}>Day</label>
              <input
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="date"
                value={field.state.value}
              />
              <FieldError meta={field.state.meta} />
            </>
          )}
        </form.Field>
        <form.Field name="workerId">
          {(field) => (
            <>
              <label htmlFor={field.name}>Field worker</label>
              <select
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              >
                <option value="">Pick a worker…</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <FieldError meta={field.state.meta} />
            </>
          )}
        </form.Field>
        <form.Field mode="array" name="entranceIds">
          {(field) => (
            <fieldset>
              <legend>Entrances, in the order to visit them</legend>
              {entrances.map((entrance) => {
                const index = field.state.value.indexOf(entrance.id);
                return (
                  <label key={entrance.id}>
                    <input
                      checked={index !== -1}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        e.target.checked
                          ? field.pushValue(entrance.id)
                          : field.removeValue(index)
                      }
                      type="checkbox"
                    />
                    {index !== -1 && `${index + 1}. `}
                    {entrance.street} {entrance.number}, {entrance.entranceName}
                  </label>
                );
              })}
              <FieldError meta={field.state.meta} />
            </fieldset>
          )}
        </form.Field>
        {create.error && (
          <p className="error" role="alert">
            {create.error instanceof ApiError
              ? Object.values(create.error.errors).flat().join(" ")
              : create.error.message}
          </p>
        )}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? "Assigning…" : "Assign"}
            </button>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}
