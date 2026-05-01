import { createFileRoute } from "@tanstack/react-router";
import { ExpiredWastedStockPage } from "@/pages/ExpiredWastedStock";
export const Route = createFileRoute("/expired-wasted-stock")({ component: ExpiredWastedStockPage });
