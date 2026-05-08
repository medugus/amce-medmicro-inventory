import { createFileRoute } from "@tanstack/react-router";
import { ReadinessAuditPage } from "@/pages/ReadinessAudit";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/readiness-audit")({
  head: () => pageHead("Readiness audit", "Readiness checklist combining stock, equipment, documentation and acceptance status."),
  component: ReadinessAuditPage,
});
