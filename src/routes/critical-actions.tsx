import { createFileRoute } from "@tanstack/react-router";
import { CriticalActionsPage } from "@/pages/CriticalActions";
export const Route = createFileRoute("/critical-actions")({ component: CriticalActionsPage });
