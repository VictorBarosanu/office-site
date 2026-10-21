// apps/web/src/App.tsx — the first component
type Entrance = {
  id: number;
  address: string;
  floors: number;
  hasElevator: boolean;
};

const sample: Entrance[] = [
  { id: 1, address: "Str. Lalelelor 4, scara A", floors: 4, hasElevator: false },
  { id: 2, address: "Bd. Unirii 12, scara B", floors: 10, hasElevator: true },
];

function EntranceItem({ entrance }: { entrance: Entrance }) {
  return (
    <li>
      {entrance.address} — {entrance.floors} floors
      {entrance.hasElevator ? ", elevator" : ""}
    </li>
  );
}

export default function App() {
  return (
    <main>
      <h1>Entrances</h1>
      <ul>
        {sample.map((entrance) => (
          <EntranceItem entrance={entrance} key={entrance.id} />
        ))}
      </ul>
    </main>
  );
}