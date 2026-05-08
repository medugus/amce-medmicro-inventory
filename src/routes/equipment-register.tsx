import { createFileRoute } from "@tanstack/react-router";
import { EquipmentRegisterPage } from "@/pages/Assets";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/equipment-register")({
  head: () => pageHead("Equipment register", "All laboratory equipment with serial number, operational status, maintenance and calibration."),
  component: EquipmentRegisterPage,
});
