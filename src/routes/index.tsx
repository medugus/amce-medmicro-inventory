import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/Dashboard";
import { pageHead } from "@/lib/routeHead";
import { WELCOME_SEEN_KEY } from "@/pages/Welcome";

function IndexRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) {
        navigate({ to: "/welcome", replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [navigate]);
  return <DashboardPage />;
}

export const Route = createFileRoute("/")({
  head: () => pageHead("Dashboard", "At-a-glance status of stock, batches, supply requests, equipment and critical actions for AMCE Medical Microbiology."),
  component: IndexRoute,
});
