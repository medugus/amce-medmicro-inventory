import { createFileRoute } from "@tanstack/react-router";
import { DurablesRegisterPage } from "@/pages/Assets";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/durables-register")({
  head: () => pageHead("Durables register", "Reusable laboratory consumables and small equipment with quantity and condition."),
  component: DurablesRegisterPage,
});
