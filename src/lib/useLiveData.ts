// React hooks that subscribe to Dexie tables and re-render on changes,
// after seeding has completed.

import { useEffect, useState } from "react";
import { db, ensureSeeded } from "@/lib/db";
import type {
  InventoryItem,
  InventoryBatch,
  StockMovement,
  AcceptanceTest,
  SupplyStatusRecord,
  AuditTrailEntry,
} from "@/types";

let ready = false;
const readyListeners = new Set<() => void>();
ensureSeeded().then(() => {
  ready = true;
  readyListeners.forEach((l) => l());
  readyListeners.clear();
});

function useReady(): boolean {
  const [r, setR] = useState(ready);
  useEffect(() => {
    if (ready) { setR(true); return; }
    const fn = () => setR(true);
    readyListeners.add(fn);
    return () => { readyListeners.delete(fn); };
  }, []);
  return r;
}

function useTable<T>(loader: () => Promise<T[]>, deps: unknown[] = []): T[] {
  const ready = useReady();
  const [rows, setRows] = useState<T[]>([]);

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

export function useDataReady(): boolean {
  return useReady();
}
