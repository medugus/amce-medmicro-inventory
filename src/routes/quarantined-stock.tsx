import { createFileRoute } from "@tanstack/react-router";
import { QuarantinedStockPage } from "@/pages/QuarantinedStock";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/quarantined-stock")({
  head: () => pageHead("Quarantined stock", "Batches on hold pending investigation or rejected and awaiting discard."),
  component: QuarantinedStockPage,
});
