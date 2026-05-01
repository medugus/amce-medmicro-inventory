import { createFileRoute } from "@tanstack/react-router";
import { PurchaseRequestsPage } from "@/pages/PurchaseRequests";
export const Route = createFileRoute("/purchase-requests")({ component: PurchaseRequestsPage });
