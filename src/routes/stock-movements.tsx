import { createFileRoute } from "@tanstack/react-router";
import { StockMovementsPage } from "@/pages/StockMovements";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/stock-movements")({
  head: () => pageHead("Stock movements", "Issue, receive, return, adjust, transfer, discard and quarantine movements with audit."),
  component: StockMovementsPage,
});
