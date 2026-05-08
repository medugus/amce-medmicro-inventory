import { createFileRoute } from "@tanstack/react-router";
import { SupplyStatusPage } from "@/pages/SupplyStatus";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/supply-status")({
  head: () => pageHead("Supply status", "Live status of requested, ordered, supplied and outstanding consumables across lab sections."),
  component: SupplyStatusPage,
});
