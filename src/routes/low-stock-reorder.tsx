import { createFileRoute } from "@tanstack/react-router";
import { LowStockReorderPage } from "@/pages/LowStockReorder";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/low-stock-reorder")({
  head: () => pageHead("Low stock and reorder", "Items at or below reorder level that need a purchase request raised."),
  component: LowStockReorderPage,
});
