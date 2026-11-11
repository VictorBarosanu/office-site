// apps/web/src/routes/entrances/$entranceId.tsx — the page at /entrances/<an id>
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { entranceQuery } from "../../queries";
import { StatusBadge } from "../../StatusBadge";

export const Route = createFileRoute("/entrances/$entranceId")({
  component: EntrancePage,
  // params.entranceId is the part of the URL the file name calls $entranceId
  loader: ({ context, params }) =>
    context.queryClient.query({
      ...entranceQuery(params.entranceId),
      staleTime: "static",
    }),
  notFoundComponent: () => (
    <p className="text-muted-foreground">
      No such entrance.{" "}
      <Link className="underline" to="/entrances">
        All entrances
      </Link>
    </p>
  ),
});

function EntrancePage() {
  const { entranceId } = Route.useParams();
  const { data: entrance } = useSuspenseQuery(entranceQuery(entranceId));
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="font-semibold text-2xl">
              {entrance.street} {entrance.number}, {entrance.entranceName}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Survey</dt>
            <dd>
              <StatusBadge status={entrance.surveyStatus} />
            </dd>
            <dt className="text-muted-foreground">Pin</dt>
            <dd>
              {entrance.lat}, {entrance.lng}
            </dd>
            <dt className="text-muted-foreground">Stories</dt>
            <dd>{entrance.stories ?? "not surveyed yet"}</dd>
          </dl>
        </CardContent>
      </Card>
      <Link className={buttonVariants({ variant: "outline" })} to="/entrances">
        All entrances
      </Link>
    </>
  );
}
