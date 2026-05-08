import { createFileRoute } from "@tanstack/react-router";
import { ScanPage } from "@/pages/Scan";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/scan")({
  head: () => pageHead("Scan", "Scan a QR code or paste a link to jump to the matching batch, equipment or item."),
  component: ScanPage,
});
