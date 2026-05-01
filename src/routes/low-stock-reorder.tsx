import { createFileRoute } from "@tanstack/react-router";
import { LowStockReorderPage } from "@/pages/LowStockReorder";
export const Route = createFileRoute("/low-stock-reorder")({ component: LowStockReorderPage });
