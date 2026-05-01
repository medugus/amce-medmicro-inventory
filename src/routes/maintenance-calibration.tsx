import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceCalibrationPage } from "@/pages/Assets";
export const Route = createFileRoute("/maintenance-calibration")({ component: MaintenanceCalibrationPage });
