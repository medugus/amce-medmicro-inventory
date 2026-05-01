import { createFileRoute } from "@tanstack/react-router";
import { QuarantinedStockPage } from "@/pages/QuarantinedStock";
export const Route = createFileRoute("/quarantined-stock")({ component: QuarantinedStockPage });
