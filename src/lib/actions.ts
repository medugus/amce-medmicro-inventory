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
  InventoryItem,
  EquipmentAsset,
  DurableAsset,
  AcceptanceStatus,
} from "@/types";
import { db, newId, appendAudit } from "@/lib/db";
import { notifyDbChanged } from "@/lib/useLiveData";
import { isBatchIssuable, validateMovement } from "@/logic/inventory";
import { getCurrentUser } from "@/lib/currentUser";
import { recordMovementSchema, createBatchSchema } from "@/lib/schemas";
import { todayISODate, nowISODateTime, toISODate } from "@/lib/dates";
import { AuthRequiredError, requestUserPicker } from "@/lib/authError";

function requireUser(): string {
  const u = getCurrentUser();
  if (!u) {
    requestUserPicker();
    throw new AuthRequiredError();
  }
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

export async function recordMovement(rawInput: RecordMovementInput): Promise<StockMovement> {
  const performedBy = requireUser();
  const parsed = recordMovementSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid movement input.");
  const input = parsed.data as RecordMovementInput;

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
      dateTime: nowISODateTime(),
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

// ---------- Receive a new batch ----------

export interface CreateBatchInput {
  inventoryItemId: string;
  batchNumber: string;
  lotNumber: string | null;
  quantityReceived: number;
  expiryDate: string | null;
  dateReceived: string;
  storageLocation: string;
  storageConditionRequired: string;
  notes: string;
}

export async function createBatch(rawInput: CreateBatchInput): Promise<InventoryBatch> {
  const user = requireUser();
  const parsed = createBatchSchema.safeParse({
    ...rawInput,
    expiryDate: toISODate(rawInput.expiryDate),
    dateReceived: toISODate(rawInput.dateReceived) ?? rawInput.dateReceived,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid batch input.");
  const input = parsed.data as CreateBatchInput;

  return db.transaction("rw", [db.inventory, db.batches, db.movements, db.audit], async () => {
    const item = await db.inventory.get(input.inventoryItemId);
    if (!item) throw new Error("Inventory item not found.");

    const batch: InventoryBatch = {
      id: newId("bat"),
      inventoryItemId: input.inventoryItemId,
      batchNumber: input.batchNumber.trim(),
      lotNumber: input.lotNumber?.trim() || null,
      quantityReceived: input.quantityReceived,
      quantityAvailable: input.quantityReceived,
      expiryDate: input.expiryDate || null,
      dateReceived: input.dateReceived,
      storageLocation: input.storageLocation || item.storageCondition || "",
      storageConditionRequired: input.storageConditionRequired || item.storageCondition || "",
      acceptanceStatus: "Pending acceptance" as AcceptanceStatus,
      batchStatus: "Pending acceptance",
      certificateOfAnalysisAvailable: false,
      qcRequired: true,
      qcResult: "Pending",
      acceptedBy: null,
      dateAccepted: null,
      quarantineReason: null,
      notes: input.notes,
    };
    await db.batches.add(batch);

    // Log a Receive movement so the batch appears in the movements log.
    const movement: StockMovement = {
      id: newId("mv"),
      inventoryItemId: batch.inventoryItemId,
      batchId: batch.id,
      movementType: "Receive",
      quantity: input.quantityReceived,
      fromSection: null,
      toSection: item.laboratorySection,
      dateTime: nowISODateTime(),
      performedBy: user,
      authorisedBy: null,
      reason: "Initial receipt — pending acceptance testing",
      referenceNumber: null,
      notes: input.notes,
    };
    await db.movements.add(movement);

    await appendAudit({
      user, action: "Receive batch", module: "Batch Register", entityId: batch.id,
      previousValue: null,
      newValue: `${item.itemName} · batch ${batch.batchNumber} · qty ${batch.quantityReceived} · exp ${batch.expiryDate ?? "Not documented"}`,
      reason: "", notes: input.notes,
    });

    notifyDbChanged();
    return batch;
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

  return db.transaction("rw", [db.batches, db.inventory, db.acceptance, db.audit], async () => {
    const batch = await db.batches.get(input.batchId);
    if (!batch) throw new Error("Batch not found.");
    const item = await db.inventory.get(batch.inventoryItemId);

    const today = todayISODate();
    const test: AcceptanceTest = {
      id: newId("acc"),
      batchId: batch.id,
      itemName: item?.itemName ?? "",
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

// ---------- Inventory Master CRUD ----------

export type InventoryItemInput = Omit<InventoryItem, "id">;

function summariseInventory(i: InventoryItem): string {
  return `${i.itemName} · ${i.category} · reorder ${i.reorderLevel} · ${i.criticality}`;
}

export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  const user = requireUser();
  const item: InventoryItem = { id: newId("inv"), ...input };
  await db.inventory.add(item);
  await appendAudit({
    user, action: "Create inventory item", module: "Inventory Master", entityId: item.id,
    previousValue: null, newValue: summariseInventory(item), reason: "", notes: "",
  });
  notifyDbChanged();
  return item;
}

export async function updateInventoryItem(id: string, patch: Partial<InventoryItemInput>, reason = ""): Promise<void> {
  const user = requireUser();
  const existing = await db.inventory.get(id);
  if (!existing) throw new Error("Inventory item not found.");
  await db.inventory.update(id, patch);
  const merged = { ...existing, ...patch } as InventoryItem;
  await appendAudit({
    user, action: "Update inventory item", module: "Inventory Master", entityId: id,
    previousValue: summariseInventory(existing), newValue: summariseInventory(merged), reason, notes: "",
  });
  notifyDbChanged();
}

export async function deleteInventoryItem(id: string, reason: string): Promise<void> {
  const user = requireUser();
  if (!reason.trim()) throw new Error("Deletion requires a documented reason.");
  const existing = await db.inventory.get(id);
  if (!existing) throw new Error("Inventory item not found.");
  const batchCount = await db.batches.where("inventoryItemId").equals(id).count();
  if (batchCount > 0) throw new Error("Cannot delete: this item has batches recorded against it. Mark inactive instead.");
  await db.inventory.delete(id);
  await appendAudit({
    user, action: "Delete inventory item", module: "Inventory Master", entityId: id,
    previousValue: summariseInventory(existing), newValue: null, reason, notes: "",
  });
  notifyDbChanged();
}

// ---------- Equipment CRUD ----------

export type EquipmentInput = Omit<EquipmentAsset, "id">;

function summariseEquipment(e: EquipmentAsset): string {
  return `${e.equipmentName} · ${e.equipmentCategory} · ${e.operationalStatus} · serial ${e.serialNumber ?? "—"}`;
}

export async function createEquipment(input: EquipmentInput): Promise<EquipmentAsset> {
  const user = requireUser();
  const asset: EquipmentAsset = { id: newId("eq"), ...input };
  await db.equipment.add(asset);
  await appendAudit({
    user, action: "Create equipment", module: "Equipment Register", entityId: asset.id,
    previousValue: null, newValue: summariseEquipment(asset), reason: "", notes: "",
  });
  notifyDbChanged();
  return asset;
}

export async function updateEquipment(id: string, patch: Partial<EquipmentInput>, reason = ""): Promise<void> {
  const user = requireUser();
  const existing = await db.equipment.get(id);
  if (!existing) throw new Error("Equipment not found.");
  await db.equipment.update(id, patch);
  const merged = { ...existing, ...patch } as EquipmentAsset;
  await appendAudit({
    user, action: "Update equipment", module: "Equipment Register", entityId: id,
    previousValue: summariseEquipment(existing), newValue: summariseEquipment(merged), reason, notes: "",
  });
  notifyDbChanged();
}

export async function deleteEquipment(id: string, reason: string): Promise<void> {
  const user = requireUser();
  if (!reason.trim()) throw new Error("Deletion requires a documented reason.");
  const existing = await db.equipment.get(id);
  if (!existing) throw new Error("Equipment not found.");
  await db.equipment.delete(id);
  await appendAudit({
    user, action: "Delete equipment", module: "Equipment Register", entityId: id,
    previousValue: summariseEquipment(existing), newValue: null, reason, notes: "",
  });
  notifyDbChanged();
}

// ---------- Durables CRUD ----------

export type DurableInput = Omit<DurableAsset, "id">;

function summariseDurable(d: DurableAsset): string {
  return `${d.assetName} · ${d.assetCategory} · qty ${d.quantity ?? "—"} · ${d.condition}`;
}

export async function createDurable(input: DurableInput): Promise<DurableAsset> {
  const user = requireUser();
  const asset: DurableAsset = { id: newId("dur"), ...input };
  await db.durables.add(asset);
  await appendAudit({
    user, action: "Create durable", module: "Durables Register", entityId: asset.id,
    previousValue: null, newValue: summariseDurable(asset), reason: "", notes: "",
  });
  notifyDbChanged();
  return asset;
}

export async function updateDurable(id: string, patch: Partial<DurableInput>, reason = ""): Promise<void> {
  const user = requireUser();
  const existing = await db.durables.get(id);
  if (!existing) throw new Error("Durable not found.");
  await db.durables.update(id, patch);
  const merged = { ...existing, ...patch } as DurableAsset;
  await appendAudit({
    user, action: "Update durable", module: "Durables Register", entityId: id,
    previousValue: summariseDurable(existing), newValue: summariseDurable(merged), reason, notes: "",
  });
  notifyDbChanged();
}

export async function deleteDurable(id: string, reason: string): Promise<void> {
  const user = requireUser();
  if (!reason.trim()) throw new Error("Deletion requires a documented reason.");
  const existing = await db.durables.get(id);
  if (!existing) throw new Error("Durable not found.");
  await db.durables.delete(id);
  await appendAudit({
    user, action: "Delete durable", module: "Durables Register", entityId: id,
    previousValue: summariseDurable(existing), newValue: null, reason, notes: "",
  });
  notifyDbChanged();
}
