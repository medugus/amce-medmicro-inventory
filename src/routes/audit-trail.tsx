import { createFileRoute } from "@tanstack/react-router";
import { AuditTrailPage } from "@/pages/AuditTrail";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/audit-trail")({
  head: () => pageHead("Audit trail", "Append-only log of all inventory, batch, supply and equipment changes with user and reason."),
  component: AuditTrailPage,
});
