// apps/web/src/EntranceForm.tsx — a controlled form, validated by the shared schema
import { fieldErrors, NewEntrance } from "@office/shared";
import type { Building, Entrance } from "field-app-contract/contract";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API } from "./api";

type Errors = Partial<Record<string, string[]>>;

// "" must fail as a number: Number("") would be 0, a valid latitude
const toNumber = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text);

export function EntranceForm({
  buildings,
  onCreated,
}: {
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
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/entrances`, {
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add an entrance</CardTitle>
        <CardDescription className="text-xs">
          Assign the entrance to a building and provide its street coordinates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buildingId">Building</Label>
              <Select onValueChange={setBuildingId} value={buildingId}>
                <SelectTrigger className="w-full" id="buildingId">
                  <SelectValue placeholder="Pick a building…" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buildingId && (
                <p className="text-destructive text-xs">
                  {errors.buildingId[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                onChange={(e) => setStreet(e.target.value)}
                value={street}
              />
              {errors.street && (
                <p className="text-destructive text-xs">{errors.street[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                onChange={(e) => setNumber(e.target.value)}
                value={number}
              />
              {errors.number && (
                <p className="text-destructive text-xs">{errors.number[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entranceName">Entrance</Label>
              <Input
                id="entranceName"
                onChange={(e) => setEntranceName(e.target.value)}
                placeholder="Sc. A"
                value={entranceName}
              />
              {errors.entranceName && (
                <p className="text-destructive text-xs">
                  {errors.entranceName[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                inputMode="decimal"
                onChange={(e) => setLat(e.target.value)}
                placeholder="44.43128"
                value={lat}
              />
              {errors.lat && (
                <p className="text-destructive text-xs">{errors.lat[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                inputMode="decimal"
                onChange={(e) => setLng(e.target.value)}
                placeholder="26.10102"
                value={lng}
              />
              {errors.lng && (
                <p className="text-destructive text-xs">{errors.lng[0]}</p>
              )}
            </div>
          </div>

          <Button disabled={submitting} type="submit">
            {submitting ? "Adding…" : "Add the entrance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
