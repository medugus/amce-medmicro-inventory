// Local persistent data layer (IndexedDB via Dexie).
//
// On first run on a given computer, the database is seeded from the bundled
// data files (the same baseline as your laptop). After that, every action
// (movements, acceptance, quarantine/release, discard, supply updates) writes
// to this database and to the audit trail.
//
// Each computer keeps its own data; there is no sync.

import Dexie, { type Table } from "dexie";
import type {
  InventoryItem,
  InventoryBatch,
  StockMovement,
  AcceptanceTest,
  SupplyStatusRecord,
  AuditTrailEntry,
  EquipmentAsset,
  DurableAsset,
} from "@/types";

import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_STOCK_MOVEMENTS } from "@/data/amceStockMovements";
import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_AUDIT_TRAIL } from "@/data/amceAuditTrail";
import { AMCE_EQUIPMENT, AMCE_DURABLES } from "@/data/amceAssets";

class AMCEDatabase extends Dexie {
  inventory!: Table<InventoryItem, string>;
  batches!: Table<InventoryBatch, string>;
  movements!: Table<StockMovement, string>;
  acceptance!: Table<AcceptanceTest, string>;
  supply!: Table<SupplyStatusRecord, string>;
  audit!: Table<AuditTrailEntry, string>;
  equipment!: Table<EquipmentAsset, string>;
  durables!: Table<DurableAsset, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("amce-microbiology");
    this.version(1).stores({
      inventory: "id, itemName, laboratorySection, category, criticality",
      batches: "id, inventoryItemId, batchNumber, expiryDate, batchStatus, acceptanceStatus",
      movements: "id, inventoryItemId, batchId, dateTime, movementType, performedBy",
      acceptance: "id, batchId, dateAccepted, acceptedOrRejected",
      supply: "id, itemName, laboratorySection, supplyStatus, criticality",
      audit: "id, dateTime, user, module, entityId",
      meta: "key",
    });
    this.version(2).stores({
      inventory: "id, itemName, laboratorySection, category, criticality",
      batches: "id, inventoryItemId, batchNumber, expiryDate, batchStatus, acceptanceStatus",
      movements: "id, inventoryItemId, batchId, dateTime, movementType, performedBy",
      acceptance: "id, batchId, dateAccepted, acceptedOrRejected",
      supply: "id, itemName, laboratorySection, supplyStatus, criticality",
      audit: "id, dateTime, user, module, entityId",
      equipment: "id, equipmentName, laboratorySection, equipmentCategory, operationalStatus",
      durables: "id, assetName, laboratorySection, assetCategory, condition",
      meta: "key",
    });
  }
}

export const db = new AMCEDatabase();

// Bump this string whenever the bundled seed data changes meaningfully and
// you want each lab PC to re-seed missing rows from the new baseline. We will
// only INSERT rows that don't already exist on the lab PC, so user-entered
// data is never overwritten.
const SEED_VERSION = "2026-05-01.1";

let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const meta = await db.meta.get("seedVersion");
    if (meta?.value === SEED_VERSION) return;

    // Use bulkPut only for the catalogue + bundled batches (these are baseline
    // reference data). For movements/acceptance/audit we only seed if the
    // table is empty so we never overwrite work the lab has done.
    await db.transaction(
      "rw",
      [db.inventory, db.batches, db.supply, db.movements, db.acceptance, db.audit, db.equipment, db.durables, db.meta],
      async () => {
        // Catalogue + supply backlog: keep current entries, fill in any missing.
        const existingInv = new Set((await db.inventory.toCollection().primaryKeys()) as string[]);
        const newInv = AMCE_INVENTORY_MASTER.filter((i) => !existingInv.has(i.id));
        if (newInv.length) await db.inventory.bulkAdd(newInv);

        const existingBatches = new Set((await db.batches.toCollection().primaryKeys()) as string[]);
        const newBatches = AMCE_BATCHES.filter((b) => !existingBatches.has(b.id));
        if (newBatches.length) await db.batches.bulkAdd(newBatches);

        const existingSupply = new Set((await db.supply.toCollection().primaryKeys()) as string[]);
        const newSupply = AMCE_SUPPLY_STATUS.filter((s) => !existingSupply.has(s.id));
        if (newSupply.length) await db.supply.bulkAdd(newSupply);

        // Movements / acceptance / audit: only seed if completely empty.
        if ((await db.movements.count()) === 0 && AMCE_STOCK_MOVEMENTS.length) {
          await db.movements.bulkAdd(AMCE_STOCK_MOVEMENTS);
        }
        if ((await db.acceptance.count()) === 0 && AMCE_ACCEPTANCE_TESTS.length) {
          await db.acceptance.bulkAdd(AMCE_ACCEPTANCE_TESTS);
        }
        if ((await db.audit.count()) === 0 && AMCE_AUDIT_TRAIL.length) {
          await db.audit.bulkAdd(AMCE_AUDIT_TRAIL);
        }

        await db.meta.put({ key: "seedVersion", value: SEED_VERSION });
      }
    );
  })();
  return seedPromise;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendAudit(entry: Omit<AuditTrailEntry, "id" | "dateTime"> & { dateTime?: string }) {
  const row: AuditTrailEntry = {
    id: newId("aud"),
    dateTime: entry.dateTime ?? new Date().toISOString(),
    user: entry.user,
    action: entry.action,
    module: entry.module,
    entityId: entry.entityId,
    previousValue: entry.previousValue ?? null,
    newValue: entry.newValue ?? null,
    reason: entry.reason ?? "",
    notes: entry.notes ?? "",
  };
  await db.audit.add(row);
  return row;
}
