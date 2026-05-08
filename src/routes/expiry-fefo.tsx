import { createFileRoute } from "@tanstack/react-router";
import { ExpiryFEFOPage } from "@/pages/ExpiryFEFO";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/expiry-fefo")({
  head: () => pageHead("Expiry and FEFO", "First-expiry-first-out queue showing batches due to expire and recommended issue order."),
  component: ExpiryFEFOPage,
});
