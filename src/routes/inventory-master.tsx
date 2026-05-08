import { createFileRoute } from "@tanstack/react-router";
import { InventoryMasterPage } from "@/pages/InventoryMaster";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/inventory-master")({
  head: () => pageHead("Inventory master", "Master list of reagents, kits and consumables with criticality, reorder level and storage."),
  component: InventoryMasterPage,
});
