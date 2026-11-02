import type { Building, Entrance } from "@office/shared";
import { useEffect, useState } from "react";
import { EntranceForm } from "./EntranceForm";

const API = "http://localhost:3000";

function EntranceItem({ entrance }: { entrance: Entrance }) {
  return (
    <li>
      {entrance.address} ({entrance.buildingName}) — {entrance.floors} floors,{" "}
      {entrance.hasElevator ? "elevator" : "no elevator"}
    </li>
  );
}

export default function App() {
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(`${API}/api/entrances`).then((res) => res.json()),
      fetch(`${API}/api/buildings`).then((res) => res.json()),
    ])
      .then(([entranceList, buildingList]: [Entrance[], Building[]]) => {
        if (!ignore) {
          setEntrances(entranceList);
          setBuildings(buildingList);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main>
      <h1>Entrances</h1>
      {error && <p role="alert">Could not load the entrances.</p>}
      <EntranceForm
        api={API}
        buildings={buildings}
        onCreated={(entrance) => setEntrances([...entrances, entrance])}
      />
      <ul>
        {entrances.map((entrance) => (
          <EntranceItem entrance={entrance} key={entrance.id} />
        ))}
      </ul>
    </main>
  );
}
