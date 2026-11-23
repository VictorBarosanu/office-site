// apps/web/src/Pager.tsx — Prev and Next under a list: links to ?offset=…, so the page is in the URL;
// the other search params (?q=…) stay as they are
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";

// a list page's validateSearch: ?offset=10; missing or malformed, the first page
// (.default makes it optional on a Link, .catch turns ?offset=abc into 0)
export const pageSearch = z.object({
  offset: z.number().int().min(0).catch(0).default(0),
});

// a disabled Link is an <a aria-disabled="true">: drawn faded, not clickable
const pager = `${buttonVariants({ size: "sm", variant: "outline" })} aria-disabled:pointer-events-none aria-disabled:opacity-50`;

export function Pager({
  limit,
  offset,
  total,
}: {
  limit: number;
  offset: number;
  total: number;
}) {
  const last = Math.min(offset + limit, total);
  return (
    <nav aria-label="Pages" className="flex items-center gap-2 text-sm">
      <Link
        className={pager}
        disabled={offset === 0}
        search={(prev) => ({ ...prev, offset: Math.max(offset - limit, 0) })}
        to="."
      >
        Prev
      </Link>
      <span className="text-muted-foreground">
        {total === 0 ? 0 : offset + 1}–{last} of {total}
      </span>
      <Link
        className={pager}
        disabled={last >= total}
        search={(prev) => ({ ...prev, offset: offset + limit })}
        to="."
      >
        Next
      </Link>
    </nav>
  );
}
