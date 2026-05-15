// React hooks that subscribe to Dexie tables and re-render on changes,
// after seeding has completed.

import { useEffect, useState } from "react";
import { db, ensureDurablesSeeded, ensureEquipmentSeeded, ensureSeeded } from "@/lib/db";
import { AMCE_DURABLES, AMCE_EQUIPMENT } from "@/data/amceAssets";
import type {
  InventoryItem,
  InventoryBatch,
  StockMovement,
  AcceptanceTest,
  SupplyStatusRecord,
  AuditTrailEntry,
  EquipmentAsset,
  DurableAsset,
  SectionForecast,
  PurchaseRequest,
  GtinCatalogueEntry,
  ScanHistoryEntry,
} from "@/types";

let ready = false;
let dataLayerPromise: Promise<void> | null = null;
const readyListeners = new Set<() => void>();

export function initializeDataLayer(): Promise<void> {
  if (ready) return Promise.resolve();
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    ready = true;
    return Promise.resolve();
  }
  if (dataLayerPromise) return dataLayerPromise;

  // Seed local Dexie first (so the device has the bundled baseline if cloud is
  // empty), then start cloud sync (push seed up if cloud is empty, then pull
  // cloud → local, then open realtime).
  dataLayerPromise = ensureSeeded()
    .then(() => import("@/lib/cloudSync").then((m) => m.startCloudSync()))
    .catch((err) => {
      console.error("Failed to initialise data layer:", err);
    })
    .finally(() => {
      ready = true;
      readyListeners.forEach((l) => l());
      readyListeners.clear();
    });
  return dataLayerPromise;
}

if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
  void initializeDataLayer();
}

function useReady(): boolean {
  const [r, setR] = useState(ready);
  useEffect(() => {
    if (ready) {
      setR(true);
      return;
    }
    if (typeof indexedDB === "undefined") {
      setR(true);
      return;
    }
    const fn = () => setR(true);
    readyListeners.add(fn);
    void initializeDataLayer();
    if (ready) {
      readyListeners.delete(fn);
      setR(true);
      return;
    }
    return () => {
      readyListeners.delete(fn);
    };
  }, []);
  return r;
}

function useTable<T>(loader: () => Promise<T[]>, deps: unknown[] = [], initialRows: T[] = []): T[] {
  const ready = useReady();
  const [rows, setRows] = useState<T[]>(initialRows);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function refresh() {
      const data = await loader();
      if (!cancelled) setRows(data);
    }
    refresh();
    const onChange = () => refresh();
    window.addEventListener("amce:db-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("amce:db-changed", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps]);

  return rows;
}

export function notifyDbChanged() {
  window.dispatchEvent(new CustomEvent("amce:db-changed"));
}

export function useInventory(): InventoryItem[] {
  return useTable(() => db.inventory.toArray());
}

export function useBatches(): InventoryBatch[] {
  return useTable(() => db.batches.toArray());
}

export function useStockMovements(): StockMovement[] {
  return useTable(() =>
    db.movements
      .toArray()
      .then((rows) => rows.sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""))),
  );
}

export function useAcceptanceTests(): AcceptanceTest[] {
  return useTable(() => db.acceptance.toArray());
}

export function useSupplyStatus(): SupplyStatusRecord[] {
  return useTable(() => db.supply.toArray());
}

export function useAuditTrail(): AuditTrailEntry[] {
  return useTable(() =>
    db.audit
      .toArray()
      .then((rows) => rows.sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""))),
  );
}

export function useEquipment(): EquipmentAsset[] {
  return useTable(
    async () => {
      await ensureEquipmentSeeded();
      const rows = await db.equipment.toArray();
      return rows.length ? rows : AMCE_EQUIPMENT;
    },
    [],
    AMCE_EQUIPMENT,
  );
}

export function useDurables(): DurableAsset[] {
  return useTable(
    async () => {
      await ensureDurablesSeeded();
      const rows = await db.durables.toArray();
      return rows.length ? rows : AMCE_DURABLES;
    },
    [],
    AMCE_DURABLES,
  );
}

export function useForecasts(): SectionForecast[] {
  return useTable(() => db.forecasts.toArray());
}

export function usePurchaseRequests(): PurchaseRequest[] {
  return useTable(() =>
    db.purchaseRequests
      .toArray()
      .then((rows) =>
        rows.sort((a, b) => (b.requestDate ?? "").localeCompare(a.requestDate ?? "")),
      ),
  );
}

export function useGtinCatalogue(): GtinCatalogueEntry[] {
  return useTable(() =>
    db.gtinCatalogue
      .toArray()
      .then((rows) => rows.sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""))),
  );
}

export function useScanHistory(limit = 10): ScanHistoryEntry[] {
  return useTable(
    () =>
      db.scanHistory
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (b.scannedAt ?? "").localeCompare(a.scannedAt ?? "")).slice(0, limit),
        ),
    [limit],
  );
}

export function useDataReady(): boolean {
  return useReady();
}
