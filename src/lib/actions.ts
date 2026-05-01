// Domain actions: write to Dexie + audit trail. All actions require a current
// user (set via the top-bar user picker). The user's name is stamped on the
// movement and on the audit entry.

import type {
  StockMovement,
  MovementType,
  LaboratorySectionId,
  InventoryBatch,
  SupplyStatusRecord,
  AcceptanceTest,
  BatchStatus,
} from "@/types";
import { db, newId, appendAudit } from "@/lib/db";
import { notifyDbChanged } from "@/lib/useLiveData";
import { isBatchIssuable, validateMovement } from "@/logic/inventory";
import { getCurrentUser } from "@/lib/currentUser";

function requireUser(): string {
  const u = getCurrentUser();
  if (!u) throw new Error("Select a user in the top bar before recording actions.");
  return u.name;
}

// ---------- Stock movements ----------

export interface RecordMovementInput {
  movementType: MovementType;
  inventoryItemId: string;
  batchId: string;
  quantity: number;
  fromSection: LaboratorySectionId | null;
  toSection: LaboratorySectionId | null;
  reason: string;
  authorisedBy: string | null;
  referenceNumber: string | null;
  notes: string;
}

export async function recordMovement(input: RecordMovementInput): Promise<StockMovement> {
  const performedBy = requireUser();

  return db.transaction("rw", [db.batches, db.movements, db.audit], async () => {
    const batch = await db.batches.get(input.batchId);
    if (!batch) throw new Error("Selected batch not found.");

    const validationError = validateMovement(
      {
        movementType: input.movementType,
        quantity: input.quantity,
        reason: input.reason,
        authorisedBy: input.authorisedBy,
      },
      batch
    );
    if (validationError) throw new Error(validationError);

    // Apply the side-effect on the batch.
    const updated: Partial<InventoryBatch> = {};
    let newAvailable = batch.quantityAvailable;
    let statusChange: BatchStatus | null = null;

    switch (input.movementType) {
      case "Issue":
      case "Discard":
        newAvailable = batch.quantityAvailable - input.quantity;
        if (input.movementType === "Discard") statusChange = "Discarded";
        break;
      case "Receive":
      case "Return":
        newAvailable = batch.quantityAvailable + input.quantity;
        break;
      case "Adjust":
        newAvailable = input.quantity; // treat quantity as the corrected total
        break;
      case "Transfer":
        // No quantity change at the batch level for an internal transfer.
        break;
      case "Quarantine":
        statusChange = "Quarantined";
        break;
      case "Release from quarantine":
        statusChange = "Accepted";
        break;
    }

    if (newAvailable < 0) throw new Error("This action would create a negative balance.");

    updated.quantityAvailable = newAvailable;
    if (statusChange) updated.batchStatus = statusChange;
    if (newAvailable === 0 && input.movementType === "Issue") {
      updated.batchStatus = batch.batchStatus === "Accepted" ? "Consumed" : batch.batchStatus;
    }

    await db.batches.update(batch.id, updated);

    const movement: StockMovement = {
      id: newId("mv"),
      inventoryItemId: input.inventoryItemId,
      batchId: input.batchId,
      movementType: input.movementType,
      quantity: input.quantity,
      fromSection: input.fromSection,
      toSection: input.toSection,
      dateTime: new Date().toISOString(),
      performedBy,
      authorisedBy: input.authorisedBy,
      reason: input.reason,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
    };
    await db.movements.add(movement);

    await appendAudit({
      user: performedBy,
      action: input.movementType,
      module: "Stock Movements",
      entityId: batch.id,
      previousValue: `qty ${batch.quantityAvailable}, status ${batch.batchStatus}`,
      newValue: `qty ${updated.quantityAvailable}, status ${updated.batchStatus ?? batch.batchStatus}`,
      reason: input.reason,
      notes: input.notes,
    });

    notifyDbChanged();
    return movement;
  });
}

// ---------- Acceptance ----------

export interface RecordAcceptanceInput {
  batchId: string;
  decision: "Accepted" | "Rejected";
  qcResult: "Pass" | "Fail" | "Pending" | "Not required";
  certificateOfAnalysisAvailable: boolean;
  physicalCondition: AcceptanceTest["physicalCondition"];
  comments: string;
  correctiveActionIfRejected: string;
}

export async function recordAcceptance(input: RecordAcceptanceInput): Promise<AcceptanceTest> {
  const acceptedBy = requireUser();

  return db.transaction("rw", [db.batches, db.acceptance, db.audit], async () => {
    const batch = await db.batches.get(input.batchId);
    if (!batch) throw new Error("Batch not found.");

    const today = new Date().toISOString().slice(0, 10);
    const test: AcceptanceTest = {
      id: newId("acc"),
      batchId: batch.id,
      itemName: "",
      lotNumber: batch.lotNumber,
      dateReceived: batch.dateReceived,
      expiryDate: batch.expiryDate,
      storageConditionOnReceipt: batch.storageConditionRequired,
      physicalCondition: input.physicalCondition,
      certificateOfAnalysisAvailable: input.certificateOfAnalysisAvailable,
      qcPerformed: input.qcResult !== "Not required",
      qcResult: input.qcResult,
      acceptedOrRejected: input.decision,
      acceptedBy,
      dateAccepted: today,
      correctiveActionIfRejected: input.correctiveActionIfRejected,
      comments: input.comments,
    };
    await db.acceptance.add(test);

    const newBatchStatus: BatchStatus = input.decision === "Accepted" ? "Accepted" : "Rejected";
    await db.batches.update(batch.id, {
      acceptanceStatus: input.decision,
      batchStatus: newBatchStatus,
      acceptedBy,
      dateAccepted: today,
      certificateOfAnalysisAvailable: input.certificateOfAnalysisAvailable,
      qcResult: input.qcResult,
    });

    await appendAudit({
      user: acceptedBy,
      action: input.decision === "Accepted" ? "Accept batch" : "Reject batch",
      module: "Acceptance Testing",
      entityId: batch.id,
      previousValue: `${batch.acceptanceStatus} / ${batch.batchStatus}`,
      newValue: `${input.decision} / ${newBatchStatus}`,
      reason: input.comments,
      notes: input.correctiveActionIfRejected,
    });

    notifyDbChanged();
    return test;
  });
}

// ---------- Quarantine ----------

export async function quarantineBatch(batchId: string, reason: string) {
  const user = requireUser();
  const batch = await db.batches.get(batchId);
  if (!batch) throw new Error("Batch not found.");
  if (!reason.trim()) throw new Error("Quarantine requires a documented reason.");

  await db.batches.update(batchId, { batchStatus: "Quarantined", quarantineReason: reason });
  await appendAudit({
    user, action: "Quarantine", module: "Quarantined Stock", entityId: batchId,
    previousValue: batch.batchStatus, newValue: "Quarantined", reason, notes: "",
  });
  notifyDbChanged();
}

export async function releaseFromQuarantine(batchId: string, notes: string) {
  const user = requireUser();
  const batch = await db.batches.get(batchId);
  if (!batch) throw new Error("Batch not found.");
  await db.batches.update(batchId, { batchStatus: "Accepted", quarantineReason: null });
  await appendAudit({
    user, action: "Release from quarantine", module: "Quarantined Stock", entityId: batchId,
    previousValue: "Quarantined", newValue: "Accepted", reason: notes, notes: "",
  });
  notifyDbChanged();
}

export async function discardBatch(batchId: string, reason: string) {
  const user = requireUser();
  const batch = await db.batches.get(batchId);
  if (!batch) throw new Error("Batch not found.");
  if (!reason.trim()) throw new Error("Discard requires a documented reason.");

  await db.batches.update(batchId, { batchStatus: "Discarded", quantityAvailable: 0 });
  await appendAudit({
    user, action: "Discard", module: "Quarantined Stock", entityId: batchId,
    previousValue: `${batch.batchStatus} / qty ${batch.quantityAvailable}`,
    newValue: "Discarded / qty 0", reason, notes: "",
  });
  notifyDbChanged();
}

// ---------- Supply status ----------

export interface UpdateSupplyInput {
  id: string;
  patch: Partial<Omit<SupplyStatusRecord, "id">>;
  reason: string;
}

export async function updateSupplyRecord(input: UpdateSupplyInput) {
  const user = requireUser();
  const existing = await db.supply.get(input.id);
  if (!existing) throw new Error("Supply record not found.");
  await db.supply.update(input.id, input.patch);

  const summary = (s: SupplyStatusRecord) =>
    `${s.supplyStatus} / ${s.procurementStatus} / supplied ${s.suppliedQuantity ?? "—"}`;
  const merged = { ...existing, ...input.patch } as SupplyStatusRecord;

  await appendAudit({
    user, action: "Update supply status", module: "Supply Status", entityId: input.id,
    previousValue: summary(existing), newValue: summary(merged), reason: input.reason, notes: "",
  });
  notifyDbChanged();
}

export { isBatchIssuable };
