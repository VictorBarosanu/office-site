// apps/web/src/EntranceForm.tsx — a controlled form, validated by the shared schema
import { fieldErrors, NewEntrance } from "@office/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Building, Entrance } from "field-app-contract/contract";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ApiError, postJson } from "./api";

type Errors = Partial<Record<string, string[]>>;

// the zod messages of one field, in the shape shadcn's FieldError reads
const errorsOf = (messages: string[] | undefined) =>
  messages?.map((message) => ({ message }));

// a label, an input and its errors: five of the form's six fields
function TextField({
  errors,
  id,
  label,
  onChange,
  value,
  ...rest
}: {
  errors: string[] | undefined;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
  inputMode?: "decimal";
  placeholder?: string;
}) {
  return (
    <Field data-invalid={errors !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={errors !== undefined}
        id={id}
        onChange={(e) => onChange(e.target.value)}
        value={value}
        {...rest}
      />
      <FieldError errors={errorsOf(errors)} />
    </Field>
  );
}

// "" must fail as a number: Number("") would be 0, a valid latitude
const toNumber = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text);

export function EntranceForm({ buildings }: { buildings: Building[] }) {
  const [buildingId, setBuildingId] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [entranceName, setEntranceName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const queryClient = useQueryClient();
  // a write: TanStack Query tracks it (isPending) and says when it is done
  const create = useMutation({
    mutationFn: (entrance: NewEntrance) =>
      postJson<Entrance>("/api/entrances", entrance),
    onError: (error) =>
      setErrors(error instanceof ApiError ? error.errors : {}),
    onSuccess: () => {
      // every query whose key starts with "entrances" is stale: refetch them
      queryClient.invalidateQueries({ queryKey: ["entrances"] });
      setNumber("");
      setEntranceName("");
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // no page reload: React handles the submit
    // the server's schema, run before anything leaves the browser
    const result = NewEntrance.safeParse({
      buildingId, // a UUID now: a string, no Number(…)
      entranceName,
      lat: toNumber(lat),
      lng: toNumber(lng),
      number,
      street,
    });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    create.mutate(result.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add an entrance</CardTitle>
      </CardHeader>
      <CardContent>
        {/* one column on a phone, two from 640px */}
        <form
          className="grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={handleSubmit}
        >
          <Field data-invalid={errors.buildingId !== undefined}>
            <FieldLabel htmlFor="buildingId">Building</FieldLabel>
            <NativeSelect
              aria-invalid={errors.buildingId !== undefined}
              id="buildingId"
              onChange={(e) => setBuildingId(e.target.value)}
              value={buildingId}
            >
              <NativeSelectOption value="">Pick a building…</NativeSelectOption>
              {buildings.map((building) => (
                <NativeSelectOption key={building.id} value={building.id}>
                  {building.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={errorsOf(errors.buildingId)} />
          </Field>
          <TextField
            errors={errors.street}
            id="street"
            label="Street"
            onChange={setStreet}
            value={street}
          />
          <TextField
            errors={errors.number}
            id="number"
            label="Number"
            onChange={setNumber}
            value={number}
          />
          <TextField
            errors={errors.entranceName}
            id="entranceName"
            label="Entrance"
            onChange={setEntranceName}
            placeholder="Sc. A"
            value={entranceName}
          />
          <TextField
            errors={errors.lat}
            id="lat"
            inputMode="decimal"
            label="Latitude"
            onChange={setLat}
            placeholder="44.43128"
            value={lat}
          />
          <TextField
            errors={errors.lng}
            id="lng"
            inputMode="decimal"
            label="Longitude"
            onChange={setLng}
            placeholder="26.10102"
            value={lng}
          />
          <Button
            className="sm:col-span-2 sm:justify-self-start"
            disabled={create.isPending}
            type="submit"
          >
            Add the entrance
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
