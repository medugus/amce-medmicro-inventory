import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/Dashboard";
import { pageHead } from "@/lib/routeHead";
import { WELCOME_SEEN_KEY } from "@/pages/Welcome";

function IndexRoute() {
  // Decide synchronously BEFORE rendering Dashboard, so first-time visitors
  // don't see Dashboard flash on screen and then get jumped to /welcome.
  if (typeof window !== "undefined") {
    let seen = true;
    try {
      seen = !!window.localStorage.getItem(WELCOME_SEEN_KEY);
    } catch {
      /* ignore */
    }
    if (!seen) {
      return <Navigate to="/welcome" replace />;
    }
  }
  return <DashboardPage />;
}

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Dashboard",
      "At-a-glance status of stock, batches, supply requests, equipment and critical actions for AMCE Medical Microbiology.",
    ),
  component: IndexRoute,
});
