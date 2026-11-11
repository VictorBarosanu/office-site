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
      <h1 className="font-semibold text-3xl">Map</h1>
      <EntranceMap entrances={entrances} />
      {/* the legend: what a pin's colour means, and how many there are */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SurveyStatus.options.map((status) => (
          <li className="flex items-center gap-2" key={status}>
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
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
