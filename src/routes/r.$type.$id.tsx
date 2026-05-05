import { createFileRoute } from "@tanstack/react-router";
import { ResolvePage } from "@/pages/Resolve";
export const Route = createFileRoute("/r/$type/$id")({ component: ResolvePage });
