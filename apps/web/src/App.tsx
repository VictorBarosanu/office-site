// apps/web/src/App.tsx — the list comes from the server
import { useEffect, useState } from "react";
import type { Entrance } from "@office/shared";

const API = "http://localhost:3000";

function EntranceItem({ entrance }: { entrance: Entrance }) {
  return (
    <li>
      {entrance.address} — {entrance.floors} floors
      {entrance.hasElevator ? ", elevator" : ""}
    </li>
  );
}

export default function App() {
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`${API}/api/entrances`)
      .then((res) => res.json())
      .then((data: Entrance[]) => {
        if (!ignore) {
          setEntrances(data);
        }
      })
      .catch((err: Error) => {
        if (!ignore) {
          setError(err.message);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main>
      <h1>Entrances</h1>
      {error && <p role="alert">Could not load the entrances: {error}</p>}
      <ul>
        {entrances.map((entrance) => (
          <EntranceItem entrance={entrance} key={entrance.id} />
        ))}
      </ul>
    </main>
  );
}