import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/pages/Welcome";
import { pageHead } from "@/lib/routeHead";

export const Route = createFileRoute("/welcome")({
  head: () => pageHead("Welcome", "Quick 2-minute walkthrough of the AMCE Lab Inventory daily workflow."),
  component: WelcomePage,
});
