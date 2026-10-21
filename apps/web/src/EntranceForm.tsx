// apps/web/src/EntranceForm.tsx — a controlled form, validated by hand
import { type Entrance, fieldErrors, NewEntrance } from "@office/shared";
import { type FormEvent, useState } from "react";

type Errors = Partial<Record<string, string[]>>;

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
    // the server's schema, run before anything leaves the browser
    const result = NewEntrance.safeParse({ address, floors: Number(floors), hasElevator });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    const res = await fetch(`${api}/api/entrances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
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
      {errors.address && <p className="error">{errors.address[0]}</p>}
      <label>
        Floors
        <input
          inputMode="numeric"
          onChange={(e) => setFloors(e.target.value)}
          value={floors}
        />
      </label>
      {errors.floors && <p className="error">{errors.floors[0]}</p>}
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