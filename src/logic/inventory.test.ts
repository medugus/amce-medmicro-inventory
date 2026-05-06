import { describe, it, expect } from "vitest";
import { validateMovement, isBatchIssuable, totalAvailableForItem, fefoBatches, expiryBucket } from "./inventory";
import type { InventoryBatch } from "@/types";

function batch(over: Partial<InventoryBatch> = {}): InventoryBatch {
  return {
    id: "b1",
    inventoryItemId: "i1",
    batchNumber: "B1",
    lotNumber: null,
    quantityReceived: 100,
    quantityAvailable: 100,
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
  } as InventoryBatch;
}

describe("isBatchIssuable", () => {
  it("blocks pending acceptance", () => {
    expect(isBatchIssuable(batch({ batchStatus: "Pending acceptance" })).ok).toBe(false);
  });
  it("blocks zero quantity", () => {
    expect(isBatchIssuable(batch({ quantityAvailable: 0 })).ok).toBe(false);
  });
  it("allows available with stock", () => {
    expect(isBatchIssuable(batch()).ok).toBe(true);
  });
});

describe("validateMovement", () => {
  const b = batch();
  it("rejects non-positive qty", () => {
    expect(validateMovement({ movementType: "Issue", quantity: 0, reason: "", authorisedBy: null }, b)).toMatch(/greater than zero/);
  });
  it("rejects issue when quarantined", () => {
    expect(
      validateMovement({ movementType: "Issue", quantity: 1, reason: "", authorisedBy: null }, batch({ batchStatus: "Quarantined" }))
    ).toMatch(/Cannot issue/);
  });
  it("rejects issue exceeding available", () => {
    expect(
      validateMovement({ movementType: "Issue", quantity: 999, reason: "", authorisedBy: null }, b)
    ).toMatch(/exceeds available/);
  });
  it("requires reason for adjust", () => {
    expect(
      validateMovement({ movementType: "Adjust", quantity: 1, reason: "  ", authorisedBy: null }, b)
    ).toMatch(/documented reason/);
  });
  it("requires authoriser for discard", () => {
    expect(
      validateMovement({ movementType: "Discard", quantity: 1, reason: "expired", authorisedBy: null }, b)
    ).toMatch(/authorisation/);
  });
  it("accepts a valid issue", () => {
    expect(
      validateMovement({ movementType: "Issue", quantity: 5, reason: "", authorisedBy: null }, b)
    ).toBeNull();
  });
});

describe("FEFO + totals", () => {
  const b1 = batch({ id: "a", expiryDate: "2099-12-01" });
  const b2 = batch({ id: "b", expiryDate: "2099-06-01" });
  const b3 = batch({ id: "c", batchStatus: "Quarantined", expiryDate: "2099-01-01" });
  it("orders earliest first and excludes non-issuable", () => {
    const order = fefoBatches([b1, b2, b3], "i1").map((x) => x.id);
    expect(order).toEqual(["b", "a"]);
  });
  it("totals only issuable batches", () => {
    expect(totalAvailableForItem([b1, b2, b3], "i1")).toBe(200);
  });
});

describe("expiryBucket", () => {
  it("expired in past", () => expect(expiryBucket("2000-01-01")).toBe("expired"));
  it("unknown when null", () => expect(expiryBucket(null)).toBe("unknown"));
});
