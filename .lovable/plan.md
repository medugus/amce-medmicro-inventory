# Make the inventory a shared live document

Goal: every phone/PC that has the app installed sees the same data, and any change (receive batch, mark low stock, accept item, log movement) appears on every other device within ~1 second. No login — the existing user picker keeps stamping names on the audit trail.

## Phase 1 — Foundation (this turn)

1. **Enable Lovable Cloud** (managed Postgres + realtime).
2. **Create the schema** — one table per data domain currently in IndexedDB:
   - `inventory_items` (the master catalogue)
   - `batches` (lot/expiry tracking)
   - `supply_status` (per-item supply signals & criticality)
   - `stock_movements` (in/out log)
   - `acceptance_tests` (incoming QC)
   - `assets` (equipment + durables)
   - `purchase_requests`
   - `audit_trail`
   - `app_users` (the named techs — read-only, seeds the existing picker)
3. **RLS policy**: open read + open write for all tables (no auth, closed lab use). Documented in security memory so future scans don't flag it as a regression.
4. **Seed the database** with the current `amceInventoryMaster.ts`, `amceBatches.ts`, `amceSupplyStatus.ts`, `amceAssets.ts`, `amceUsers.ts` etc. — one-time import so day 1 in the cloud matches today's state on your phone.

## Phase 2 — Data layer swap

5. Replace `src/lib/db.ts` (the IndexedDB wrapper) with a Supabase-backed equivalent that exposes the same shape, so pages don't all need rewriting.
6. Rewrite `src/lib/useLiveData.ts` to subscribe to Supabase realtime channels — each table broadcasts INSERT/UPDATE/DELETE, and every open screen rerenders automatically.
7. Keep the offline service worker. Writes made offline get queued in IndexedDB and flushed on reconnect (best-effort; conflicts use last-write-wins).

## Phase 3 — Verify across pages

8. Smoke-test every page (Dashboard, Inventory Master, Batch Register, Supply Status, Acceptance, Assets, Stock Movements, Audit Trail, Section Detail, Critical Actions, Low Stock, Expired/Wasted, Quarantined, Purchase Requests) — open in two browser windows, change in one, confirm it updates in the other.

## What changes vs. stays the same

- **Stays**: every page, every workflow, the user picker, offline shell, QR scan, all your bench/section logic, the live document feel.
- **Changes**: data lives in the cloud instead of each phone. First open after this update will replace the device's local copy with the shared cloud copy.

## Heads-up

- **One-time data wipe per device** when the new version installs: each phone discards its private IndexedDB and pulls the shared cloud state. Anything a tech entered locally that wasn't in the seed will be lost. If you've made changes since today's seed snapshot, tell me and I'll capture them first.
- **No login means no access control.** Anyone with the app URL can read and write everything. This is fine on a closed lab network; risky if the URL gets shared externally. We can bolt on login later without redoing the schema.
- This is sizeable — probably 2–3 build turns. Phase 1 (schema + seed + Cloud enable) lands in this turn; phase 2 (data layer + realtime) in the next; phase 3 (page-by-page verification) after that.

## Technical details

- Cloud: Lovable Cloud (Supabase under the hood, no separate account).
- Realtime: Supabase Postgres `realtime.publication` on all 9 tables; client subscribes per-table in `useLiveData`.
- Schema tracks the existing TypeScript types in `src/types/index.ts` so we don't have to change call sites.
- Seed runs as SQL inserts generated from the existing TS data files.
- IDs stay as the existing string IDs (not auto-generated UUIDs) so QR labels printed today keep working.
- No auth → RLS policies are `USING (true) WITH CHECK (true)` on every table. Logged in security memory.

Reply **go** to start phase 1, or tell me what to change.