import type { StockMovement } from "@/types";

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const AMCE_STOCK_MOVEMENTS: StockMovement[] = [
  { id: "mv-001", inventoryItemId: "inv-001", batchId: "b-001", movementType: "Receive", quantity: 80, fromSection: null, toSection: "stores", dateTime: addDays(-25), performedBy: "Felicita", authorisedBy: "Dr Imran", reason: "Routine delivery receipt", referenceNumber: "GRN-2025-0034", notes: "" },
  { id: "mv-002", inventoryItemId: "inv-001", batchId: "b-001", movementType: "Issue", quantity: 18, fromSection: "stores", toSection: "blood-culture", dateTime: addDays(-10), performedBy: "Felicita", authorisedBy: "George", reason: "Bench top-up", referenceNumber: "ISS-2025-0211", notes: "" },
  { id: "mv-003", inventoryItemId: "inv-005", batchId: "b-010", movementType: "Quarantine", quantity: 30, fromSection: "general-culture", toSection: null, dateTime: addDays(-7), performedBy: "Abubakar", authorisedBy: "Dr Medugu", reason: "Batch expired", referenceNumber: "QTN-2025-0019", notes: "" },
  { id: "mv-004", inventoryItemId: "inv-007", batchId: "b-011", movementType: "Quarantine", quantity: 300, fromSection: "stores", toSection: null, dateTime: addDays(-2), performedBy: "Felicita", authorisedBy: "Dr Medugu", reason: "Certificate of analysis missing", referenceNumber: "QTN-2025-0020", notes: "" },
  { id: "mv-005", inventoryItemId: "inv-009", batchId: "b-005", movementType: "Issue", quantity: 3, fromSection: "stores", toSection: "general-culture", dateTime: addDays(-20), performedBy: "Felicita", authorisedBy: "George", reason: "AST bench replenishment", referenceNumber: "ISS-2025-0190", notes: "" },
];
