// apps/web/src/StatusBadge.tsx — a survey status as a badge: one look for it everywhere
import type { SurveyStatus } from "field-app-contract/contract";
import { Badge } from "@/components/ui/badge";

const VARIANT = {
  approved: "default",
  in_progress: "secondary",
  needs_rework: "destructive",
  not_started: "outline",
  submitted: "secondary",
} as const;

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return <Badge variant={VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}
