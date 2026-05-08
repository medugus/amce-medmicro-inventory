import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/Dashboard";
import { pageHead } from "@/lib/routeHead";

export const Route = createFileRoute("/")({
  head: () => pageHead("Dashboard", "At-a-glance status of stock, batches, supply requests, equipment and critical actions for AMCE Medical Microbiology."),
  component: DashboardPage,
});
