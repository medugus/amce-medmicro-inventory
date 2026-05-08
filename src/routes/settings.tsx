import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/Settings";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/settings")({
  head: () => pageHead("Settings", "Local app preferences, data reset and seed controls."),
  component: SettingsPage,
});
