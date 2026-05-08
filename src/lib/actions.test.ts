// Action layer round-trip: write to Dexie (via fake-indexeddb), then verify
// the batch, movements log and audit trail all reflect the change.

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { setCurrentUser } from "@/lib/currentUser";
import { recordMovement, createBatch } from "@/lib/actions";
import type { InventoryItem, InventoryBatch } from "@/types";

const item: InventoryItem = {
  id: "inv-test-1",
  itemName: "Test reagent",
  category: "Reagent",
  laboratorySection: "blood-culture",
  unitOfIssue: "kit",
  manufacturer: null,
  supplier: null,
  catalogueNumber: null,
  reorderLevel: 5,
  minimumStock: 0,
  maximumStock: 100,
  storageCondition: "Room temperature",
  criticality: "High",
  active: true,
  notes: "",
};

const batch: InventoryBatch = {
  id: "bat-test-1",
  inventoryItemId: item.id,
  batchNumber: "B-001",
  lotNumber: null,
  quantityReceived: 50,
  quantityAvailable: 50,
  expiryDate: "2099-01-01",
  dateReceived: "2026-01-01",
  storageLocation: "Stores",
  storageConditionRequired: "Room temperature",
  acceptanceStatus: "Accepted",
  batchStatus: "Accepted",
  certificateOfAnalysisAvailable: true,
  qcRequired: false,
  qcResult: "Not required",
  acceptedBy: "Tester",
  dateAccepted: "2026-01-01",
  quarantineReason: null,
  notes: "",
};

async function resetDb() {
  await db.transaction(
    "rw",
    [db.inventory, db.batches, db.movements, db.acceptance, db.supply, db.audit, db.equipment, db.durables, db.forecasts, db.purchaseRequests, db.meta],
    async () => {
      await Promise.all([
        db.inventory.clear(), db.batches.clear(), db.movements.clear(),
        db.acceptance.clear(), db.supply.clear(), db.audit.clear(),
        db.equipment.clear(), db.durables.clear(),
        db.forecasts.clear(), db.purchaseRequests.clear(), db.meta.clear(),
      ]);
    }
  );
}

beforeEach(async () => {
  await resetDb();
  setCurrentUser("u-george");
});

describe("recordMovement round-trip", () => {
  it("issues stock, decrements batch, and writes movement + audit", async () => {
    await db.inventory.add(item);
    await db.batches.add(batch);

    const mv = await recordMovement({
      movementType: "Issue",
      inventoryItemId: item.id,
      batchId: batch.id,
      quantity: 10,
      fromSection: "stores",
      toSection: "blood-culture",
      reason: "bench top-up",
      authorisedBy: null,
      referenceNumber: null,
      notes: "",
    });

    expect(mv.id).toMatch(/^mv-/);
    expect(mv.performedBy).toBe("George");

    const after = await db.batches.get(batch.id);
    expect(after?.quantityAvailable).toBe(40);

    const movements = await db.movements.where("batchId").equals(batch.id).toArray();
    expect(movements).toHaveLength(1);
    expect(movements[0].movementType).toBe("Issue");

    const audit = await db.audit.where("entityId").equals(batch.id).toArray();
    expect(audit).toHaveLength(1);
    expect(audit[0].user).toBe("George");
    expect(audit[0].module).toBe("Stock Movements");
  });

  it("rejects issue exceeding available without mutating state", async () => {
    await db.inventory.add(item);
    await db.batches.add(batch);

    await expect(
      recordMovement({
        movementType: "Issue",
        inventoryItemId: item.id,
        batchId: batch.id,
        quantity: 9999,
        fromSection: null,
        toSection: null,
        reason: "",
        authorisedBy: null,
        referenceNumber: null,
        notes: "",
      })
    ).rejects.toThrow(/exceeds available/);

    const after = await db.batches.get(batch.id);
    expect(after?.quantityAvailable).toBe(50);
    expect(await db.movements.count()).toBe(0);
  });
});

describe("createBatch round-trip", () => {
  it("creates a pending-acceptance batch with a Receive movement and audit", async () => {
    await db.inventory.add(item);

    const created = await createBatch({
      inventoryItemId: item.id,
      batchNumber: "B-002",
      lotNumber: "L-1",
      quantityReceived: 25,
      expiryDate: "2099-12-31",
      dateReceived: "2026-02-01",
      storageLocation: "Stores",
      storageConditionRequired: "Room temperature",
      notes: "first delivery",
    });

    expect(created.batchStatus).toBe("Pending acceptance");
    expect(created.quantityAvailable).toBe(25);

    const mv = await db.movements.where("batchId").equals(created.id).toArray();
    expect(mv).toHaveLength(1);
    expect(mv[0].movementType).toBe("Receive");

    const audit = await db.audit.where("entityId").equals(created.id).toArray();
    expect(audit[0].action).toBe("Receive batch");
  });
});
