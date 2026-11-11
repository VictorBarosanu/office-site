// apps/web/src/routes/map.tsx — the page at /map
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SurveyStatus } from "field-app-contract/contract";
import { EntranceMap, STATUS_COLOUR } from "../EntranceMap";
import { entrancesQuery } from "../queries";

export const Route = createFileRoute("/map")({
  component: MapPage,
  loader: ({ context }) =>
    context.queryClient.query({ ...entrancesQuery, staleTime: "static" }),
});

function MapPage() {
  const { data: entrances } = useSuspenseQuery(entrancesQuery);
  return (
    <>
      <h1>Map</h1>
      <EntranceMap entrances={entrances} />
      {/* the legend: what a pin's colour means, and how many there are */}
      <ul className="legend">
        {SurveyStatus.options.map((status) => (
          <li key={status}>
            <span
              aria-hidden="true"
              className="dot"
              style={{ background: STATUS_COLOUR[status] }}
            />
            {status}:{" "}
            {entrances.filter((e) => e.surveyStatus === status).length}
          </li>
        ))}
      </ul>
    </>
  );
}
