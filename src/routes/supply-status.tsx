import { createFileRoute } from "@tanstack/react-router";
import { SupplyStatusPage } from "@/pages/SupplyStatus";
export const Route = createFileRoute("/supply-status")({ component: SupplyStatusPage });
