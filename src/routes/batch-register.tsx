import { createFileRoute } from "@tanstack/react-router";
import { BatchRegisterPage } from "@/pages/BatchRegister";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/batch-register")({
  head: () => pageHead("Batch register", "All batches received with lot number, expiry, storage and current status across the lab."),
  component: BatchRegisterPage,
});
