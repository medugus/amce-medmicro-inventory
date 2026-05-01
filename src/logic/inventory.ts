import type { InventoryBatch, InventoryItem, StockMovement } from "@/types";

export function isBatchIssuable(b: InventoryBatch): { ok: boolean; reason?: string } {
  if (b.batchStatus === "Pending acceptance") return { ok: false, reason: "Pending acceptance testing" };
  if (b.batchStatus === "Quarantined") return { ok: false, reason: "Batch is quarantined" };
  if (b.batchStatus === "Rejected") return { ok: false, reason: "Batch was rejected" };
  if (b.batchStatus === "Expired") return { ok: false, reason: "Batch is expired" };
  if (b.batchStatus === "Discarded" || b.batchStatus === "Consumed") return { ok: false, reason: "Batch no longer available" };
  if (b.quantityAvailable <= 0) return { ok: false, reason: "No quantity available" };
  return { ok: true };
}

export function daysUntilExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const e = new Date(expiry).getTime();
  const now = Date.now();
  return Math.floor((e - now) / (1000 * 60 * 60 * 24));
}

export function expiryBucket(expiry: string | null): "expired" | "30" | "60" | "90" | "ok" | "unknown" {
  const d = daysUntilExpiry(expiry);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 30) return "30";
  if (d <= 60) return "60";
  if (d <= 90) return "90";
  return "ok";
}

// FEFO: first-expiry-first-out among issuable batches of an item
export function fefoBatches(batches: InventoryBatch[], itemId: string): InventoryBatch[] {
  return batches
    .filter((b) => b.inventoryItemId === itemId && isBatchIssuable(b).ok)
    .sort((a, b) => {
      const ax = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bx = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return ax - bx;
    });
}

export function totalAvailableForItem(batches: InventoryBatch[], itemId: string): number {
  return batches
    .filter((b) => b.inventoryItemId === itemId && isBatchIssuable(b).ok)
    .reduce((s, b) => s + b.quantityAvailable, 0);
}

export function isLowStock(item: InventoryItem, batches: InventoryBatch[]): boolean {
  return totalAvailableForItem(batches, item.id) <= item.reorderLevel;
}

export function validateMovement(
  movement: Pick<StockMovement, "movementType" | "quantity" | "reason" | "authorisedBy">,
  batch: InventoryBatch
): string | null {
  if (movement.quantity <= 0) return "Quantity must be greater than zero.";
  if (movement.movementType === "Issue") {
    const eligibility = isBatchIssuable(batch);
    if (!eligibility.ok) return `Cannot issue: ${eligibility.reason}.`;
    if (movement.quantity > batch.quantityAvailable) return "Issue quantity exceeds available stock. Negative balance not permitted.";
  }
  if (movement.movementType === "Adjust" && !movement.reason.trim()) return "Stock adjustment requires a documented reason.";
  if (movement.movementType === "Discard" && !movement.authorisedBy) return "Discard requires authorisation by a designated officer.";
  return null;
}
