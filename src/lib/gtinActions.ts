// Actions for GTIN catalogue (local product-name lookup) and scan history.

import { db, newId, appendAudit } from "@/lib/db";
import { notifyDbChanged } from "@/lib/useLiveData";
import type { GtinCatalogueEntry, GtinCategory, ScanHistoryEntry } from "@/types";
import { getCurrentUser } from "@/lib/currentUser";

export interface GtinUpsertInput {
  gtin: string;
  productName: string;
  manufacturer?: string | null;
  unit?: string | null;
  category?: GtinCategory | null;
  inventoryItemId?: string | null;
}

export async function getGtinEntry(gtin: string): Promise<GtinCatalogueEntry | undefined> {
  if (!gtin) return undefined;
  return db.gtinCatalogue.get(gtin);
}

export async function touchGtinSeen(gtin: string): Promise<void> {
  if (!gtin) return;
  const existing = await db.gtinCatalogue.get(gtin);
  if (!existing) return;
  await db.gtinCatalogue.update(gtin, { lastSeenAt: new Date().toISOString() });
  notifyDbChanged();
}

export async function upsertGtinEntry(input: GtinUpsertInput): Promise<GtinCatalogueEntry> {
  const user = getCurrentUser()?.name ?? "unknown";
  const now = new Date().toISOString();
  const existing = await db.gtinCatalogue.get(input.gtin);
  const entry: GtinCatalogueEntry = {
    gtin: input.gtin,
    productName: input.productName.trim(),
    manufacturer: input.manufacturer?.trim() || null,
    unit: input.unit?.trim() || null,
    category: input.category ?? existing?.category ?? null,
    inventoryItemId: input.inventoryItemId ?? existing?.inventoryItemId ?? null,
    createdAt: existing?.createdAt ?? now,
    lastSeenAt: now,
  };
  await db.gtinCatalogue.put(entry);
  await appendAudit({
    user,
    action: existing ? "Update GTIN catalogue" : "Add GTIN catalogue",
    module: "GTIN Catalogue",
    entityId: entry.gtin,
    previousValue: existing ? `${existing.productName} (${existing.manufacturer ?? "—"})` : null,
    newValue: `${entry.productName} (${entry.manufacturer ?? "—"})`,
    reason: "",
    notes: "",
  });
  notifyDbChanged();
  return entry;
}

export async function deleteGtinEntry(gtin: string): Promise<void> {
  const user = getCurrentUser()?.name ?? "unknown";
  const existing = await db.gtinCatalogue.get(gtin);
  if (!existing) return;
  await db.gtinCatalogue.delete(gtin);
  await appendAudit({
    user,
    action: "Delete GTIN catalogue",
    module: "GTIN Catalogue",
    entityId: gtin,
    previousValue: `${existing.productName} (${existing.manufacturer ?? "—"})`,
    newValue: null,
    reason: "",
    notes: "",
  });
  notifyDbChanged();
}

export async function recordScan(input: Omit<ScanHistoryEntry, "id" | "scannedAt" | "scannedBy">): Promise<void> {
  const user = getCurrentUser()?.name ?? "unknown";
  const row: ScanHistoryEntry = {
    id: newId("scan"),
    scannedAt: new Date().toISOString(),
    scannedBy: user,
    ...input,
  };
  await db.scanHistory.add(row);
  // Keep history bounded — trim to most recent 200
  const count = await db.scanHistory.count();
  if (count > 200) {
    const all = await db.scanHistory.toArray();
    all.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));
    const toDrop = all.slice(0, count - 200).map((r) => r.id);
    if (toDrop.length) await db.scanHistory.bulkDelete(toDrop);
  }
  notifyDbChanged();
}
