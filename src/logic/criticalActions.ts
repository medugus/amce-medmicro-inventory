import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_FORECASTS } from "@/data/amceForecasts";
import { AMCE_EQUIPMENT } from "@/data/amceAssets";
import { SECTION_NAME, AMCE_SECTIONS } from "@/data/amceSections";
import { expiryBucket, isLowStock, totalAvailableForItem } from "./inventory";
import { actionRequired, isCriticalRisk, supplyStatusFlags } from "./supplyStatus";
import { isCalibrationDue, isMaintenanceDue } from "./equipment";
import type {
  InventoryItem,
  InventoryBatch,
  SupplyStatusRecord,
  EquipmentAsset,
  SectionForecast,
} from "@/types";

export interface CriticalActionsData {
  inventory?: InventoryItem[];
  batches?: InventoryBatch[];
  supply?: SupplyStatusRecord[];
  equipment?: EquipmentAsset[];
  forecasts?: SectionForecast[];
}

export type ActionPriority = "Critical" | "High" | "Medium" | "Low";
export type ActionGroup =
  | "Critical stock-out or low stock"
  | "Pending procurement"
  | "Partially supplied items"
  | "Expired stock"
  | "Batches pending acceptance"
  | "Quarantined or rejected stock"
  | "Missing documentation"
  | "Equipment maintenance or calibration due"
  | "Section forecasts requiring review";

export interface CriticalAction {
  id: string;
  group: ActionGroup;
  priority: ActionPriority;
  itemOrAsset: string;
  section: string;
  responsible: string;
  reason: string;
  nextStep: string;
  status: string;
}

const sectionLead = (id: string): string => {
  const s = AMCE_SECTIONS.find((x) => x.id === id);
  return s ? s.leads.join(", ") : "Pending assignment";
};

export function buildCriticalActions(data: CriticalActionsData = {}): CriticalAction[] {
  const inventory = data.inventory ?? AMCE_INVENTORY_MASTER;
  const batches = data.batches ?? AMCE_BATCHES;
  const supply = data.supply ?? AMCE_SUPPLY_STATUS;
  const equipment = data.equipment ?? AMCE_EQUIPMENT;
  const forecasts = data.forecasts ?? AMCE_FORECASTS;
  const actions: CriticalAction[] = [];

  // 1. Critical stock-out or low stock
  for (const item of AMCE_INVENTORY_MASTER) {
    if (!isLowStock(item, AMCE_BATCHES)) continue;
    const avail = totalAvailableForItem(AMCE_BATCHES, item.id);
    actions.push({
      id: `low-${item.id}`,
      group: "Critical stock-out or low stock",
      priority: avail === 0 ? "Critical" : (item.criticality as ActionPriority),
      itemOrAsset: item.itemName,
      section: SECTION_NAME[item.laboratorySection],
      responsible: sectionLead(item.laboratorySection),
      reason: avail === 0 ? "Stock-out: no usable batches available" : `Available ${avail} at or below reorder ${item.reorderLevel}`,
      nextStep: "Raise or follow up purchase request",
      status: avail === 0 ? "Stock-out" : "Below reorder level",
    });
  }

  // 2. Pending procurement
  for (const r of AMCE_SUPPLY_STATUS) {
    if (r.supplyStatus !== "Pending procurement") continue;
    actions.push({
      id: `pp-${r.id}`,
      group: "Pending procurement",
      priority: r.criticality as ActionPriority,
      itemOrAsset: r.itemName,
      section: SECTION_NAME[r.laboratorySection],
      responsible: r.responsiblePerson,
      reason: r.remarks || "Procurement not yet initiated",
      nextStep: actionRequired(r),
      status: r.procurementStatus,
    });
  }

  // 3. Partially supplied
  for (const r of AMCE_SUPPLY_STATUS) {
    if (r.supplyStatus !== "Partially supplied") continue;
    actions.push({
      id: `ps-${r.id}`,
      group: "Partially supplied items",
      priority: r.criticality as ActionPriority,
      itemOrAsset: r.itemName,
      section: SECTION_NAME[r.laboratorySection],
      responsible: r.responsiblePerson,
      reason: `Outstanding ${r.outstandingQuantity ?? "Not documented"} ${r.unitOfIssue}`,
      nextStep: actionRequired(r),
      status: r.procurementStatus,
    });
  }

  // 4. Expired stock
  for (const b of AMCE_BATCHES) {
    if (expiryBucket(b.expiryDate) !== "expired" && b.batchStatus !== "Expired") continue;
    const item = AMCE_INVENTORY_MASTER.find((i) => i.id === b.inventoryItemId);
    if (!item) continue;
    actions.push({
      id: `exp-${b.id}`,
      group: "Expired stock",
      priority: "High",
      itemOrAsset: `${item.itemName} (batch ${b.batchNumber})`,
      section: SECTION_NAME[item.laboratorySection],
      responsible: sectionLead(item.laboratorySection),
      reason: `Batch expired on ${b.expiryDate ?? "Not documented"}`,
      nextStep: "Quarantine and discard with authorisation",
      status: b.batchStatus,
    });
  }

  // 5. Batches pending acceptance
  for (const b of AMCE_BATCHES) {
    if (b.batchStatus !== "Pending acceptance") continue;
    const item = AMCE_INVENTORY_MASTER.find((i) => i.id === b.inventoryItemId);
    if (!item) continue;
    actions.push({
      id: `pa-${b.id}`,
      group: "Batches pending acceptance",
      priority: item.criticality as ActionPriority,
      itemOrAsset: `${item.itemName} (batch ${b.batchNumber})`,
      section: SECTION_NAME[item.laboratorySection],
      responsible: sectionLead(item.laboratorySection),
      reason: b.notes || "Awaiting acceptance testing",
      nextStep: "Complete acceptance testing and QC",
      status: b.acceptanceStatus,
    });
  }

  // 6. Quarantined or rejected
  for (const b of AMCE_BATCHES) {
    if (b.batchStatus !== "Quarantined" && b.batchStatus !== "Rejected") continue;
    const item = AMCE_INVENTORY_MASTER.find((i) => i.id === b.inventoryItemId);
    if (!item) continue;
    actions.push({
      id: `q-${b.id}`,
      group: "Quarantined or rejected stock",
      priority: "High",
      itemOrAsset: `${item.itemName} (batch ${b.batchNumber})`,
      section: SECTION_NAME[item.laboratorySection],
      responsible: sectionLead(item.laboratorySection),
      reason: b.quarantineReason || "Hold pending investigation",
      nextStep: "Investigate, escalate, release or discard",
      status: b.batchStatus,
    });
  }

  // 7. Missing documentation
  for (const r of AMCE_SUPPLY_STATUS) {
    const flags = supplyStatusFlags(r);
    if (flags.length === 0) continue;
    actions.push({
      id: `md-${r.id}`,
      group: "Missing documentation",
      priority: isCriticalRisk(r) ? "Critical" : "Medium",
      itemOrAsset: r.itemName,
      section: SECTION_NAME[r.laboratorySection],
      responsible: r.responsiblePerson,
      reason: flags.map((f) => f.message).join("; "),
      nextStep: actionRequired(r),
      status: r.supplyStatus,
    });
  }

  // 8. Equipment maintenance or calibration due
  for (const eq of AMCE_EQUIPMENT) {
    const m = isMaintenanceDue(eq);
    const c = isCalibrationDue(eq);
    if (!m && !c) continue;
    actions.push({
      id: `eq-${eq.id}`,
      group: "Equipment maintenance or calibration due",
      priority: "High",
      itemOrAsset: eq.equipmentName,
      section: SECTION_NAME[eq.laboratorySection],
      responsible: eq.responsibleOfficer ?? "Pending assignment",
      reason: [m ? "Maintenance due" : null, c ? "Calibration due" : null].filter(Boolean).join("; "),
      nextStep: "Schedule service or calibration",
      status: eq.operationalStatus,
    });
  }

  // 9. Forecasts requiring review (Critical priority)
  for (const f of AMCE_FORECASTS) {
    if (f.priority !== "Critical") continue;
    actions.push({
      id: `fc-${f.id}`,
      group: "Section forecasts requiring review",
      priority: "Critical",
      itemOrAsset: f.itemName,
      section: SECTION_NAME[f.laboratorySection],
      responsible: f.responsiblePerson,
      reason: f.justification || "Critical forecast requires review",
      nextStep: "Convert to purchase request and approve",
      status: "Forecast submitted",
    });
  }

  return actions;
}

export const PRIORITY_ORDER: ActionPriority[] = ["Critical", "High", "Medium", "Low"];
