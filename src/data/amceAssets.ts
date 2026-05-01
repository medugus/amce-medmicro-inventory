import type { EquipmentAsset, DurableAsset, MaintenanceRecord, CalibrationRecord } from "@/types";

// Equipment register intentionally empty in seed: real equipment data must be imported.
// Do not fabricate serial numbers, asset numbers, or calibration dates.
export const AMCE_EQUIPMENT: EquipmentAsset[] = [];

export const AMCE_DURABLES: DurableAsset[] = [];

export const AMCE_MAINTENANCE: MaintenanceRecord[] = [];

export const AMCE_CALIBRATION: CalibrationRecord[] = [];
