// apps/web/src/routes/entrances/$entranceId.tsx — the page at /entrances/<an id>
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { Entrance } from "field-app-contract/contract";
import { API } from "../../api";

export const Route = createFileRoute("/entrances/$entranceId")({
  component: EntrancePage,
  // params.entranceId is the part of the URL the file name calls $entranceId
  loader: async ({ params }) => {
    const res = await fetch(`${API}/api/entrances/${params.entranceId}`);
    if (res.status === 404) {
      throw notFound();
    }
    return (await res.json()) as Entrance;
  },
  notFoundComponent: () => (
    <p>
      No such entrance. <Link to="/entrances">All entrances</Link>
    </p>
  ),
});

function EntrancePage() {
  const entrance = Route.useLoaderData();
  return (
    <>
      <h1>
        {entrance.street} {entrance.number}, {entrance.entranceName}
      </h1>
      <dl>
        <dt>Survey</dt>
        <dd>{entrance.surveyStatus}</dd>
        <dt>Pin</dt>
        <dd>
          {entrance.lat}, {entrance.lng}
        </dd>
        <dt>Stories</dt>
        <dd>{entrance.stories ?? "not surveyed yet"}</dd>
      </dl>
      <Link to="/entrances">All entrances</Link>
    </>
  );
}
