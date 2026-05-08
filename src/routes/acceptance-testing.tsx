import { createFileRoute } from "@tanstack/react-router";
import { AcceptanceTestingPage } from "@/pages/AcceptanceTesting";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/acceptance-testing")({
  head: () => pageHead("Acceptance testing", "Record physical condition, QC and decision for incoming batches before they are issued."),
  component: AcceptanceTestingPage,
});
