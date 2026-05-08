import { createFileRoute } from "@tanstack/react-router";
import { SectionForecastingPage } from "@/pages/SectionForecasting";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/section-forecasting")({
  head: () => pageHead("Section forecasting", "Three-month consumable forecasts per laboratory section with priority and justification."),
  component: SectionForecastingPage,
});
