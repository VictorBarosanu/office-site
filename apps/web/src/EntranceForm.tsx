// apps/web/src/EntranceForm.tsx — a controlled form, validated by hand
import type { Entrance } from "@office/shared";
import { type FormEvent, useState } from "react";

type Errors = Record<string, string>;

export function EntranceForm({
  api,
  onCreated,
}: {
  api: string;
  onCreated: (entrance: Entrance) => void;
}) {
  const [address, setAddress] = useState("");
  const [floors, setFloors] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // no page reload: React handles the submit
    // the same checks as the server's, written a second time
    const found: Errors = {};
    if (address.trim() === "") {
      found.address = "Address is required";
    }
    if (!Number.isInteger(Number(floors)) || Number(floors) < 0) {
      found.floors = "Floors must be a whole number, 0 or more";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    const res = await fetch(`${api}/api/entrances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, floors: Number(floors), hasElevator }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(data.errors);
      return;
    }
    onCreated(data);
    setAddress("");
    setFloors("");
    setHasElevator(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <label>
        Address
        <input onChange={(e) => setAddress(e.target.value)} value={address} />
      </label>
      {errors.address && <p className="error">{errors.address}</p>}
      <label>
        Floors
        <input
          inputMode="numeric"
          onChange={(e) => setFloors(e.target.value)}
          value={floors}
        />
      </label>
      {errors.floors && <p className="error">{errors.floors}</p>}
      <label>
        <input
          checked={hasElevator}
          onChange={(e) => setHasElevator(e.target.checked)}
          type="checkbox"
        />
        Has an elevator
      </label>
      <button type="submit">Add the entrance</button>
    </form>
  );
}
