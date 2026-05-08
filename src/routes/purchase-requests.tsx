import { createFileRoute } from "@tanstack/react-router";
import { PurchaseRequestsPage } from "@/pages/PurchaseRequests";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/purchase-requests")({
  head: () => pageHead("Purchase requests", "Section purchase requests with quantity, justification and approval status."),
  component: PurchaseRequestsPage,
});
