import { createFileRoute } from "@tanstack/react-router";
import { ProcurementFollowupPage } from "@/pages/ProcurementFollowup";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/procurement-followup")({
  head: () => pageHead("Procurement follow-up", "Open requests pending procurement, ordered or partially supplied that need chasing."),
  component: ProcurementFollowupPage,
});
