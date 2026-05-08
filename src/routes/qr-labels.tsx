import { createFileRoute } from "@tanstack/react-router";
import { QrLabelsPage } from "@/pages/QrLabels";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/qr-labels")({
  head: () => pageHead("QR labels", "Generate scannable QR labels for batches, equipment and durables."),
  component: QrLabelsPage,
});
