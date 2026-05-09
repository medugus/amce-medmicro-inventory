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
} from "@/types";

let ready = false;
const readyListeners = new Set<() => void>();
if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
  ensureSeeded()
    .then(() => {
      ready = true;
      readyListeners.forEach((l) => l());
      readyListeners.clear();
    })
    .catch((err) => {
      console.error("Failed to seed local database:", err);
      ready = true;
      readyListeners.forEach((l) => l());
      readyListeners.clear();
    });
}

function useReady(): boolean {
  const [r, setR] = useState(ready);
  useEffect(() => {
    if (ready) { setR(true); return; }
    if (typeof indexedDB === "undefined") { setR(true); return; }
    const fn = () => setR(true);
    readyListeners.add(fn);
    ensureSeeded()
      .then(() => {
        ready = true;
        fn();
      })
      .catch((err) => {
        console.error("Failed to seed local database:", err);
        ready = true;
        fn();
      });
    if (ready) {
      readyListeners.delete(fn);
      setR(true);
      return;
    }
    return () => { readyListeners.delete(fn); };
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
    db.movements.toArray().then((rows) =>
      rows.sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""))
    )
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
    db.audit.toArray().then((rows) =>
      rows.sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""))
    )
  );
}

export function useEquipment(): EquipmentAsset[] {
  return useTable(async () => {
    await ensureEquipmentSeeded();
    const rows = await db.equipment.toArray();
    return rows.length ? rows : AMCE_EQUIPMENT;
  }, [], AMCE_EQUIPMENT);
}

export function useDurables(): DurableAsset[] {
  return useTable(async () => {
    await ensureDurablesSeeded();
    const rows = await db.durables.toArray();
    return rows.length ? rows : AMCE_DURABLES;
  }, [], AMCE_DURABLES);
}

export function useForecasts(): SectionForecast[] {
  return useTable(() => db.forecasts.toArray());
}

export function usePurchaseRequests(): PurchaseRequest[] {
  return useTable(() =>
    db.purchaseRequests.toArray().then((rows) =>
      rows.sort((a, b) => (b.requestDate ?? "").localeCompare(a.requestDate ?? ""))
    )
  );
}

export function useDataReady(): boolean {
  return useReady();
}
