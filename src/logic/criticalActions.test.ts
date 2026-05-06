import { describe, it, expect } from "vitest";
import { buildCriticalActions } from "./criticalActions";
import type { InventoryItem, InventoryBatch, SupplyStatusRecord, EquipmentAsset, SectionForecast } from "@/types";

const item = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "i1",
  itemName: "Test reagent",
  category: "Reagent",
  laboratorySection: "blood-culture",
  unitOfIssue: "kit",
  reorderLevel: 5,
  criticality: "High",
  storageConditionRequired: "Room temperature",
  notes: "",
  ...over,
} as InventoryItem);

const batch = (over: Partial<InventoryBatch> = {}): InventoryBatch => ({
  id: "b1",
  inventoryItemId: "i1",
  batchNumber: "B1",
  lotNumber: null,
  quantityReceived: 10,
  quantityAvailable: 10,
  expiryDate: "2099-01-01",
  dateReceived: "2025-01-01",
  storageLocation: "Stores",
  storageConditionRequired: "Room temperature",
  storageConditionMet: true,
  batchStatus: "Available",
  acceptanceStatus: "Accepted",
  acceptedBy: null,
  dateAccepted: null,
  quarantineReason: null,
  discardReason: null,
  discardAuthorisedBy: null,
  notes: "",
  ...over,
} as InventoryBatch);

describe("buildCriticalActions", () => {
  it("returns empty when nothing is wrong", () => {
    const actions = buildCriticalActions({
      inventory: [item()],
      batches: [batch()],
      supply: [],
      equipment: [],
      forecasts: [],
    });
    expect(actions).toEqual([]);
  });

  it("flags stock-out as Critical priority", () => {
    const actions = buildCriticalActions({
      inventory: [item()],
      batches: [batch({ quantityAvailable: 0, batchStatus: "Consumed" })],
      supply: [],
      equipment: [],
      forecasts: [],
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].priority).toBe("Critical");
    expect(actions[0].group).toBe("Critical stock-out or low stock");
  });

  it("includes Critical-priority forecasts", () => {
    const fc: SectionForecast = {
      id: "FC-X",
      laboratorySection: "blood-culture",
      responsiblePerson: "Tester",
      itemName: "Critical kit",
      category: "Reagent",
      currentStock: 0,
      averageMonthlyUsage: 100,
      quantityNeededForThreeMonths: 300,
      requestedQuantity: 300,
      justification: "needed",
      priority: "Critical",
      estimatedCost: null,
      comments: "",
      forecastDate: "2026-01-01",
    };
    const actions = buildCriticalActions({ inventory: [], batches: [], supply: [], equipment: [], forecasts: [fc] });
    expect(actions.find((a) => a.group === "Section forecasts requiring review")).toBeTruthy();
  });

  it("ignores non-Critical forecasts", () => {
    const fc = {
      id: "FC-Y", laboratorySection: "blood-culture", responsiblePerson: "x", itemName: "x",
      category: "x", currentStock: 0, averageMonthlyUsage: 0, quantityNeededForThreeMonths: 0,
      requestedQuantity: 0, justification: "", priority: "High", estimatedCost: null,
      comments: "", forecastDate: "2026-01-01",
    } as SectionForecast;
    const actions = buildCriticalActions({ inventory: [], batches: [], supply: [], equipment: [], forecasts: [fc] });
    expect(actions).toEqual([]);
  });
});
