// Cloud sync layer for AMCE inventory.
//
// What this does:
//   1. On boot, pulls every shared table from Lovable Cloud and replaces the
//      local Dexie copy so the device starts from the shared truth.
//   2. Installs Dexie write hooks (creating/updating/deleting) that mirror
//      every local change up to Cloud as an upsert/delete.
//   3. Subscribes to Postgres realtime channels per table; incoming remote
//      changes are written into Dexie, then the existing
//      `amce:db-changed` event is dispatched so every page re-renders.
//
// The point of this design: pages and the existing `useLiveData` hooks do not
// need to change at all. Dexie remains the source the UI reads from; Cloud
// keeps it in lock-step across every device.

import { db, deletedRecordIdsForTable, forgetDeletedRecord, rememberDeletedRecord } from "@/lib/db";
import { supabase as typedSupabase } from "@/integrations/supabase/client";
import type { Table } from "dexie";

// The generated Supabase typings encode the strict per-table column shape, but
// our 12 tables share the same `(id text, data jsonb)` shape and we operate
// on them generically by name. Cast to a loose client for these calls.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;

type AnyRow = { id?: string; gtin?: string } & Record<string, unknown>;
type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE" | string;
  old?: { id?: string };
  new?: { id?: string; data?: AnyRow };
};

interface Mapping {
  /** Supabase table name */
  cloudTable: string;
  /** Local Dexie table name */
  localTable: string;
  /** Dexie table reference */
  local: Table<AnyRow, string>;
  /** Function that returns the primary key of a record */
  pk: (row: AnyRow) => string;
}

const MAPPINGS: Mapping[] = [
  {
    cloudTable: "inventory_items",
    localTable: "inventory",
    local: db.inventory as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "batches",
    localTable: "batches",
    local: db.batches as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "supply_status",
    localTable: "supply",
    local: db.supply as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "stock_movements",
    localTable: "movements",
    local: db.movements as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "acceptance_tests",
    localTable: "acceptance",
    local: db.acceptance as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "equipment",
    localTable: "equipment",
    local: db.equipment as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "durables",
    localTable: "durables",
    local: db.durables as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "forecasts",
    localTable: "forecasts",
    local: db.forecasts as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "purchase_requests",
    localTable: "purchaseRequests",
    local: db.purchaseRequests as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "audit_trail",
    localTable: "audit",
    local: db.audit as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
  {
    cloudTable: "gtin_catalogue",
    localTable: "gtinCatalogue",
    local: db.gtinCatalogue as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.gtin),
  },
  {
    cloudTable: "scan_history",
    localTable: "scanHistory",
    local: db.scanHistory as unknown as Table<AnyRow, string>,
    pk: (r) => String(r.id),
  },
];

// Track keys we've just written to Cloud so the realtime echo doesn't loop.
const recentlyMirroredUp = new Map<string, number>(); // key -> timestamp ms
const MIRROR_DEBOUNCE_MS = 2500;
const pendingLocalDeletes = new Map<string, number>(); // key -> timestamp ms
const PENDING_DELETE_MS = 30000;

function markUp(table: string, id: string) {
  recentlyMirroredUp.set(`${table}:${id}`, Date.now());
}
function wasJustMirroredUp(table: string, id: string): boolean {
  const k = `${table}:${id}`;
  const ts = recentlyMirroredUp.get(k);
  if (!ts) return false;
  if (Date.now() - ts > MIRROR_DEBOUNCE_MS) {
    recentlyMirroredUp.delete(k);
    return false;
  }
  return true;
}
function markPendingDelete(table: string, id: string) {
  pendingLocalDeletes.set(`${table}:${id}`, Date.now());
}
function clearPendingDelete(table: string, id: string) {
  pendingLocalDeletes.delete(`${table}:${id}`);
}
function isPendingDelete(table: string, id: string): boolean {
  const k = `${table}:${id}`;
  const ts = pendingLocalDeletes.get(k);
  if (!ts) return false;
  if (Date.now() - ts > PENDING_DELETE_MS) {
    pendingLocalDeletes.delete(k);
    return false;
  }
  return true;
}

function dispatchChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("amce:db-changed"));
  }
}

// Track whether a write originated from a remote realtime event so we don't
// echo it back up to the cloud and create a loop.
let applyingRemote = 0;
let pulling = false;

async function pullAll(): Promise<void> {
  if (pulling) return;
  pulling = true;
  try {
    let anyChanged = false;
    await Promise.all(
      MAPPINGS.map(async (m) => {
        try {
          // Page through to bypass the 1000-row default limit.
          const all: AnyRow[] = [];
          const PAGE = 1000;
          let from = 0;
          // Bound the loop so a misbehaving table can't spin forever.
          for (let i = 0; i < 50; i++) {
            const { data, error } = await supabase
              .from(m.cloudTable)
              .select("data")
              .range(from, from + PAGE - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            for (const row of data as Array<{ data: AnyRow }>) {
              const id = row.data ? m.pk(row.data) : "";
              // Cloud is the shared source of truth. Tombstones are used only
              // to stop bundled seed rows from being restored locally; they
              // must not hide valid shared records from Dashboard/linked pages.
              if (row.data && !isPendingDelete(m.cloudTable, id)) all.push(row.data);
            }
            if (data.length < PAGE) break;
            from += PAGE;
          }

          // Diff against the local copy so we only write rows that actually
          // changed. Blindly clear()+bulkPut() on every poll re-fires every
          // liveQuery subscriber, which makes the UI visibly blink and resets
          // scroll position every 15 seconds.
          const existing = (await m.local.toArray()) as AnyRow[];
          const existingById = new Map<string, AnyRow>();
          for (const row of existing) existingById.set(m.pk(row), row);

          const remoteIds = new Set<string>();
          const toPut: AnyRow[] = [];
          for (const row of all) {
            const id = m.pk(row);
            remoteIds.add(id);
            // A local create/update is mirrored to Cloud asynchronously. If the
            // dashboard mounts and pulls before that write is visible remotely,
            // do not roll the local edit back to the older cloud row.
            if (wasJustMirroredUp(m.cloudTable, id)) continue;
            const prev = existingById.get(id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(row)) {
              toPut.push(row);
            }
          }
          const toDelete: string[] = [];
          for (const id of existingById.keys()) {
            // Likewise, never delete a freshly-created local row just because a
            // pull beat its fire-and-forget upsert to Cloud.
            if (!remoteIds.has(id) && !wasJustMirroredUp(m.cloudTable, id)) toDelete.push(id);
          }

          if (toPut.length === 0 && toDelete.length === 0) return;

          anyChanged = true;
          applyingRemote++;
          try {
            if (toDelete.length > 0) await m.local.bulkDelete(toDelete);
            if (toPut.length > 0) await m.local.bulkPut(toPut);
          } finally {
            applyingRemote--;
          }
        } catch (err) {
          console.warn(`[cloudSync] pull failed for ${m.cloudTable}:`, err);
        }
      }),
    );
    if (anyChanged) dispatchChanged();
  } finally {
    pulling = false;
  }
}

async function pushSeedIfEmpty(): Promise<void> {
  // If a Cloud table is empty but we have local rows (the bundled seed already
  // populated Dexie), upload the local rows so day-1 cloud state matches the
  // current device's seed.
  await Promise.all(
    MAPPINGS.map(async (m) => {
      try {
        const { count, error } = await supabase
          .from(m.cloudTable)
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        if ((count ?? 0) > 0) return;

        const localRows = (await m.local.toArray()) as AnyRow[];
        if (localRows.length === 0) return;

        const payload = localRows.map((row) => ({ id: m.pk(row), data: row }));
        // Chunk uploads so we don't hit request size limits.
        const CHUNK = 500;
        for (let i = 0; i < payload.length; i += CHUNK) {
          const chunk = payload.slice(i, i + CHUNK);
          chunk.forEach((p) => markUp(m.cloudTable, p.id));
          const { error: upErr } = await supabase
            .from(m.cloudTable)
            .upsert(chunk, { onConflict: "id" });
          if (upErr) throw upErr;
        }
      } catch (err) {
        console.warn(`[cloudSync] seed upload failed for ${m.cloudTable}:`, err);
      }
    }),
  );
}

function installLocalToCloudHooks(): void {
  for (const m of MAPPINGS) {
    // Mirror creates and updates.
    const mirror = (row: AnyRow) => {
      if (applyingRemote > 0) return; // came from remote, do not echo back
      const id = m.pk(row);
      if (!id || id === "undefined" || id === "null") return;
      markUp(m.cloudTable, id);
      void forgetDeletedRecord(m.localTable, id).catch((err) => {
        console.warn(`[cloudSync] clear delete marker failed for ${m.localTable}/${id}:`, err);
      });
      // Fire-and-forget. Errors are surfaced to console only — UI already
      // shows the local change.
      supabase
        .from(m.cloudTable)
        .upsert({ id, data: row }, { onConflict: "id" })
        .then(({ error }: { error: unknown }) => {
          if (error) console.warn(`[cloudSync] upsert ${m.cloudTable}/${id} failed:`, error);
        });
    };

    m.local.hook("creating", function (_pk, obj) {
      // Run after the create completes so the row has its final shape.
      this.onsuccess = () => mirror(obj as AnyRow);
    });
    m.local.hook("updating", function (mods, _pk, obj) {
      this.onsuccess = () => {
        const merged = { ...(obj as AnyRow), ...(mods as AnyRow) };
        mirror(merged);
      };
    });
    m.local.hook("deleting", function (pk) {
      if (applyingRemote > 0) return;
      const id = String(pk);
      markUp(m.cloudTable, id);
      markPendingDelete(m.cloudTable, id);
      void rememberDeletedRecord(m.localTable, id).catch((err) => {
        console.warn(`[cloudSync] delete marker failed for ${m.localTable}/${id}:`, err);
      });
      supabase
        .from(m.cloudTable)
        .delete()
        .eq("id", id)
        .then(({ error }: { error: unknown }) => {
          if (error) {
            clearPendingDelete(m.cloudTable, id);
            console.warn(`[cloudSync] delete ${m.cloudTable}/${id} failed:`, error);
          }
        });
    });
  }
}

function installRealtime(): void {
  for (const m of MAPPINGS) {
    supabase
      .channel(`amce-${m.cloudTable}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: m.cloudTable },
        async (payload: RealtimePayload) => {
          try {
            const evt = payload.eventType;
            if (evt === "DELETE") {
              const id = String((payload.old as { id?: string })?.id ?? "");
              if (!id) return;
              clearPendingDelete(m.cloudTable, id);
              await rememberDeletedRecord(m.localTable, id);
              if (wasJustMirroredUp(m.cloudTable, id)) return;
              applyingRemote++;
              try {
                await m.local.delete(id);
              } finally {
                applyingRemote--;
              }
              dispatchChanged();
              return;
            }
            const rec = payload.new as { id?: string; data?: AnyRow };
            if (!rec || !rec.data) return;
            const id = String(rec.id ?? m.pk(rec.data));
            if (isPendingDelete(m.cloudTable, id)) return;
            if (wasJustMirroredUp(m.cloudTable, id)) return;
            await forgetDeletedRecord(m.localTable, id);
            applyingRemote++;
            try {
              await m.local.put(rec.data);
            } finally {
              applyingRemote--;
            }
            dispatchChanged();
          } catch (err) {
            console.warn(`[cloudSync] realtime apply failed for ${m.cloudTable}:`, err);
          }
        },
      )
      .subscribe((status: string) => {
        if (status !== "SUBSCRIBED") {
          console.warn(`[cloudSync] realtime ${m.cloudTable} status:`, status);
        }
      });
  }
}

function installResyncFallback(): void {
  const resync = () => {
    if (document.visibilityState === "visible" && navigator.onLine !== false) {
      void pullAll();
    }
  };

  document.addEventListener("visibilitychange", resync);
  window.addEventListener("focus", resync);
  window.addEventListener("online", resync);

  // Mobile browsers can suspend websocket subscriptions while the app is in
  // the background or installed as a home-screen app. Poll lightly so phones
  // still catch up even if realtime is paused by the OS.
  window.setInterval(resync, 15000);
}

let started: Promise<void> | null = null;
let fallbackInstalled = false;

/**
 * Initialise cloud sync. Safe to call many times — only runs once.
 * Order:
 *   1. install Dexie hooks (so any subsequent local writes mirror up)
 *   2. push local seed up if cloud is empty (first device wins)
 *   3. pull cloud → Dexie (cloud is authoritative thereafter)
 *   4. open realtime subscriptions
 */
export async function refreshFromCloud(): Promise<void> {
  try {
    await pullAll();
  } catch (err) {
    console.warn("[cloudSync] manual refresh failed:", err);
  }
}

export function startCloudSync(): Promise<void> {
  if (started) return started;
  if (typeof window === "undefined") return Promise.resolve();

  started = (async () => {
    try {
      installLocalToCloudHooks();
      await pushSeedIfEmpty();
      await pullAll();
      installRealtime();
      if (!fallbackInstalled) {
        fallbackInstalled = true;
        installResyncFallback();
      }
    } catch (err) {
      console.error("[cloudSync] initialisation failed:", err);
    }
  })();
  return started;
}
