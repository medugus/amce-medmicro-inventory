import { createFileRoute } from "@tanstack/react-router";
import { TrainingPage } from "@/pages/Training";

export const Route = createFileRoute("/training")({ component: TrainingPage });
