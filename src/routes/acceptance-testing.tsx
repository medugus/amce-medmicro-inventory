import { createFileRoute } from "@tanstack/react-router";
import { AcceptanceTestingPage } from "@/pages/AcceptanceTesting";
export const Route = createFileRoute("/acceptance-testing")({ component: AcceptanceTestingPage });
