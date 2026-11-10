import type { Building, Entrance } from "field-app-contract/contract";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntranceForm } from "./EntranceForm";

const API = "http://localhost:3000";
type Theme = "light" | "dark" | "system";

function statusVariant(
  status: Entrance["surveyStatus"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved" || status === "submitted") {
    return "default";
  }
  if (status === "needs_rework") {
    return "destructive";
  }
  if (status === "in_progress") {
    return "secondary";
  }
  return "outline";
}

export default function App() {
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("office-theme") as Theme) || "system"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("office-theme", theme);
  }, [theme]);

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Entrances</h1>
            <p className="text-muted-foreground text-sm">
              Register building entrances and monitor field survey progress.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Theme: {theme}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {error && (
          <p
            className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm"
            role="alert"
          >
            Could not load the entrances.
          </p>
        )}

        <EntranceForm
          api={API}
          buildings={buildings}
          onCreated={(entrance) => setEntrances([...entrances, entrance])}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered entrances</CardTitle>
            <CardDescription className="text-xs">
              {entrances.length} total records across {buildings.length}{" "}
              buildings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Street & Number</TableHead>
                  <TableHead>Entrance</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entrances.map((entrance) => {
                  const building = buildings.find(
                    (b) => b.id === entrance.buildingId
                  );
                  return (
                    <TableRow key={entrance.id}>
                      <TableCell className="font-medium text-sm">
                        {entrance.street} {entrance.number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entrance.entranceName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {building?.label ?? "no building"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(entrance.surveyStatus)}>
                          {entrance.surveyStatus.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {entrances.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-6 text-center text-muted-foreground text-xs"
                      colSpan={4}
                    >
                      No entrances registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
