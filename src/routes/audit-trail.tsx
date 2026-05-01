import { createFileRoute } from "@tanstack/react-router";
import { AuditTrailPage } from "@/pages/AuditTrail";
export const Route = createFileRoute("/audit-trail")({ component: AuditTrailPage });
