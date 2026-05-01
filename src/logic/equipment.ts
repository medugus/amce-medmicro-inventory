import type { EquipmentAsset } from "@/types";
import { daysUntilExpiry } from "./inventory";

export function isMaintenanceDue(eq: EquipmentAsset): boolean {
  const d = daysUntilExpiry(eq.nextMaintenanceDueDate);
  return d !== null && d <= 14;
}
export function isCalibrationDue(eq: EquipmentAsset): boolean {
  const d = daysUntilExpiry(eq.nextCalibrationDueDate);
  return d !== null && d <= 14;
}
