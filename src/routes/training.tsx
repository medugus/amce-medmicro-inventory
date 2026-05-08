import { createFileRoute } from "@tanstack/react-router";
import { TrainingPage } from "@/pages/Training";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/training")({
  head: () => pageHead("Training", "Quick guide to the workflow: receive → accept → issue → reorder → discard."),
  component: TrainingPage,
});
