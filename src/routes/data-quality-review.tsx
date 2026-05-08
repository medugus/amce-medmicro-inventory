import { createFileRoute } from "@tanstack/react-router";
import { DataQualityReviewPage } from "@/pages/DataQualityReview";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/data-quality-review")({
  head: () => pageHead("Data quality review", "Records flagged for missing supplier, quantity or reconciliation that need bench-head action."),
  component: DataQualityReviewPage,
});
