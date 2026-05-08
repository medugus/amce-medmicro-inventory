import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/pages/Reports";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/reports")({
  head: () => pageHead("Reports", "Printable summary reports across inventory, batches, supply, forecasting and equipment."),
  component: ReportsPage,
});
