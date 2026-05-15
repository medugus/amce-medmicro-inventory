import { createFileRoute } from "@tanstack/react-router";
import { SectionDetailPage } from "@/pages/SectionDetail";
import { pageHead } from "@/lib/routeHead";

export const Route = createFileRoute("/section/$sectionId")({
  head: () => pageHead("Bench detail", "Items needing attention on this laboratory bench."),
  component: SectionDetailPage,
});
