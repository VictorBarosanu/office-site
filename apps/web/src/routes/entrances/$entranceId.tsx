// apps/web/src/routes/entrances/$entranceId.tsx — the page at /entrances/<an id>
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { entranceQuery } from "../../queries";

export const Route = createFileRoute("/entrances/$entranceId")({
  component: EntrancePage,
  // params.entranceId is the part of the URL the file name calls $entranceId
  loader: ({ context, params }) =>
    context.queryClient.query({
      ...entranceQuery(params.entranceId),
      staleTime: "static",
    }),
  notFoundComponent: () => (
    <p>
      No such entrance. <Link to="/entrances">All entrances</Link>
    </p>
  ),
});

function EntrancePage() {
  const { entranceId } = Route.useParams();
  const { data: entrance } = useSuspenseQuery(entranceQuery(entranceId));
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
