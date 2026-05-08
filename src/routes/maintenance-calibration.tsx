import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceCalibrationPage } from "@/pages/Assets";
import { pageHead } from "@/lib/routeHead";
export const Route = createFileRoute("/maintenance-calibration")({
  head: () => pageHead("Maintenance and calibration", "Equipment with maintenance or calibration due dates and outstanding service tasks."),
  component: MaintenanceCalibrationPage,
});
