// apps/web/src/EntranceForm.tsx — a controlled form, validated by the shared schema
import { fieldErrors, NewEntrance } from "@office/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Building, Entrance } from "field-app-contract/contract";
import { type FormEvent, useState } from "react";
import { ApiError, postJson } from "./api";

type Errors = Partial<Record<string, string[]>>;

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
    <form noValidate onSubmit={handleSubmit}>
      <label>
        Building
        <select
          onChange={(e) => setBuildingId(e.target.value)}
          value={buildingId}
        >
          <option value="">Pick a building…</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.label}
            </option>
          ))}
        </select>
      </label>
      {errors.buildingId && <p className="error">{errors.buildingId[0]}</p>}
      <label>
        Street
        <input onChange={(e) => setStreet(e.target.value)} value={street} />
      </label>
      {errors.street && <p className="error">{errors.street[0]}</p>}
      <label>
        Number
        <input onChange={(e) => setNumber(e.target.value)} value={number} />
      </label>
      {errors.number && <p className="error">{errors.number[0]}</p>}
      <label>
        Entrance
        <input
          onChange={(e) => setEntranceName(e.target.value)}
          placeholder="Sc. A"
          value={entranceName}
        />
      </label>
      {errors.entranceName && <p className="error">{errors.entranceName[0]}</p>}
      <label>
        Latitude
        <input
          inputMode="decimal"
          onChange={(e) => setLat(e.target.value)}
          placeholder="44.43128"
          value={lat}
        />
      </label>
      {errors.lat && <p className="error">{errors.lat[0]}</p>}
      <label>
        Longitude
        <input
          inputMode="decimal"
          onChange={(e) => setLng(e.target.value)}
          placeholder="26.10102"
          value={lng}
        />
      </label>
      {errors.lng && <p className="error">{errors.lng[0]}</p>}
      <button disabled={create.isPending} type="submit">
        Add the entrance
      </button>
    </form>
  );
}
