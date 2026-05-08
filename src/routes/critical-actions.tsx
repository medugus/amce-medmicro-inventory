import { createFileRoute } from "@tanstack/react-router";
import { CriticalActionsPage } from "@/pages/CriticalActions";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/critical-actions")({
  head: () => pageHead("Critical actions", "Prioritised list of stock-outs, expired batches, pending procurement and overdue equipment service."),
  component: CriticalActionsPage,
});
