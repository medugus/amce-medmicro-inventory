import { createFileRoute } from "@tanstack/react-router";
import { QrLabelsPage } from "@/pages/QrLabels";
export const Route = createFileRoute("/qr-labels")({ component: QrLabelsPage });
