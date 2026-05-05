import type { EquipmentAsset } from "@/types";
import { daysUntilExpiry } from "./inventory";
import { getMaintWindowDays } from "@/lib/settings";

export function isMaintenanceDue(eq: EquipmentAsset, windowDays?: number): boolean {
  const w = windowDays ?? getMaintWindowDays();
  const d = daysUntilExpiry(eq.nextMaintenanceDueDate);
  return d !== null && d <= w;
}
export function isCalibrationDue(eq: EquipmentAsset, windowDays?: number): boolean {
  const w = windowDays ?? getMaintWindowDays();
  const d = daysUntilExpiry(eq.nextCalibrationDueDate);
  return d !== null && d <= w;
}
