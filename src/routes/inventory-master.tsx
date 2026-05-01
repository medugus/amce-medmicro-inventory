import { createFileRoute } from "@tanstack/react-router";
import { InventoryMasterPage } from "@/pages/InventoryMaster";
export const Route = createFileRoute("/inventory-master")({ component: InventoryMasterPage });
