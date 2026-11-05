// apps/web/src/EntranceForm.tsx — a controlled form, validated by the shared schema
import { fieldErrors, NewEntrance } from "@office/shared";
import type { Building, Entrance } from "field-app-contract/contract";
import { type FormEvent, useState } from "react";

type Errors = Partial<Record<string, string[]>>;

// "" must fail as a number: Number("") would be 0, a valid latitude
const toNumber = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text);

export function EntranceForm({
  api,
  buildings,
  onCreated,
}: {
  api: string;
  buildings: Building[];
  onCreated: (entrance: Entrance) => void;
}) {
  const [buildingId, setBuildingId] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [entranceName, setEntranceName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
    const res = await fetch(`${api}/api/entrances`, {
      body: JSON.stringify(result.data),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(data.errors);
      return;
    }
    onCreated(data);
    setNumber("");
    setEntranceName("");
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
      <button type="submit">Add the entrance</button>
    </form>
  );
}
