// apps/web/src/routes/assignments/new.tsx — the page at /assignments/new: TanStack Form
import { NewRoute } from "@office/shared";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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

// a field's errors once the user has been there: the schema's messages
interface Meta {
  errors: ({ message?: string } | undefined)[];
  isTouched: boolean;
}
const shown = (meta: Meta) => (meta.isTouched ? meta.errors : []);
const invalid = (meta: Meta) => shown(meta).length > 0;

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
      <h1 className="font-semibold text-3xl">New assignment</h1>
      <Card>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={invalid(field.state.meta)}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    aria-invalid={invalid(field.state.meta)}
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Old town, Thursday"
                    value={field.state.value}
                  />
                  <FieldError errors={shown(field.state.meta)} />
                </Field>
              )}
            </form.Field>
            <form.Field name="date">
              {(field) => (
                <Field data-invalid={invalid(field.state.meta)}>
                  <FieldLabel htmlFor={field.name}>Day</FieldLabel>
                  <Input
                    aria-invalid={invalid(field.state.meta)}
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="date"
                    value={field.state.value}
                  />
                  <FieldError errors={shown(field.state.meta)} />
                </Field>
              )}
            </form.Field>
            <form.Field name="workerId">
              {(field) => (
                <Field data-invalid={invalid(field.state.meta)}>
                  <FieldLabel htmlFor={field.name}>Field worker</FieldLabel>
                  <NativeSelect
                    aria-invalid={invalid(field.state.meta)}
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    value={field.state.value}
                  >
                    <NativeSelectOption value="">
                      Pick a worker…
                    </NativeSelectOption>
                    {workers.map((w) => (
                      <NativeSelectOption key={w.id} value={w.id}>
                        {w.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError errors={shown(field.state.meta)} />
                </Field>
              )}
            </form.Field>
            <form.Field mode="array" name="entranceIds">
              {(field) => (
                <FieldSet
                  className="sm:col-span-2"
                  data-invalid={invalid(field.state.meta)}
                >
                  <FieldLegend variant="label">
                    Entrances, in the order to visit them
                  </FieldLegend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {entrances.map((entrance) => {
                      const index = field.state.value.indexOf(entrance.id);
                      return (
                        <Field key={entrance.id} orientation="horizontal">
                          <Checkbox
                            checked={index !== -1}
                            id={`entrance-${entrance.id}`}
                            onBlur={field.handleBlur}
                            onCheckedChange={(checked) =>
                              checked
                                ? field.pushValue(entrance.id)
                                : field.removeValue(index)
                            }
                          />
                          <FieldLabel
                            className="font-normal"
                            htmlFor={`entrance-${entrance.id}`}
                          >
                            {index !== -1 && `${index + 1}. `}
                            {entrance.street} {entrance.number},{" "}
                            {entrance.entranceName}
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </div>
                  <FieldError errors={shown(field.state.meta)} />
                </FieldSet>
              )}
            </form.Field>
            {create.error && (
              <p
                className="text-destructive text-sm sm:col-span-2"
                role="alert"
              >
                {create.error instanceof ApiError
                  ? Object.values(create.error.errors).flat().join(" ")
                  : create.error.message}
              </p>
            )}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  className="sm:col-span-2 sm:justify-self-start"
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Assigning…" : "Assign"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
