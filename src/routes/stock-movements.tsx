import { createFileRoute } from "@tanstack/react-router";
import { StockMovementsPage } from "@/pages/StockMovements";
export const Route = createFileRoute("/stock-movements")({ component: StockMovementsPage });
