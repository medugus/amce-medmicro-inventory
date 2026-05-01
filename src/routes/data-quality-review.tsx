import { createFileRoute } from "@tanstack/react-router";
import { DataQualityReviewPage } from "@/pages/DataQualityReview";
export const Route = createFileRoute("/data-quality-review")({ component: DataQualityReviewPage });
