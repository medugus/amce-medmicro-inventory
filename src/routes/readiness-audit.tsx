import { createFileRoute } from "@tanstack/react-router";
import { ReadinessAuditPage } from "@/pages/ReadinessAudit";
export const Route = createFileRoute("/readiness-audit")({ component: ReadinessAuditPage });
