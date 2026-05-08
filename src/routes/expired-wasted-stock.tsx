import { createFileRoute } from "@tanstack/react-router";
import { ExpiredWastedStockPage } from "@/pages/ExpiredWastedStock";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/expired-wasted-stock")({
  head: () => pageHead("Expired and wasted stock", "Batches expired or discarded with reason, authoriser and quantity wasted."),
  component: ExpiredWastedStockPage,
});
