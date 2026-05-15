import { useEffect, useReducer } from "react";
import { Link } from "@tanstack/react-router";

import { AMCE_SECTIONS } from "@/data/amceSections";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Header } from "@/components/layout/Header";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { expiryBucket, isLowStock, totalAvailableForItem } from "@/logic/inventory";
import { isCriticalRisk, supplyStatusFlags } from "@/logic/supplyStatus";
import { isCalibrationDue, isMaintenanceDue } from "@/logic/equipment";
import { buildCriticalActions } from "@/logic/criticalActions";
import { refreshFromCloud } from "@/lib/cloudSync";
import {
  useInventory,
  useBatches,
  useSupplyStatus,
  useAcceptanceTests,
  useStockMovements,
  useEquipment,
  useDurables,
  useForecasts,
  usePurchaseRequests,
} from "@/lib/useLiveData";

const SECTION_EMOJI: Record<string, string> = {
  "blood-culture": "🩸",
  "urine-culture": "🧫",
  "general-culture": "🦠",
  "sensitivity": "💊",
  "tb-mgit": "🫁",
  "gram-stain": "🔬",
  "serology": "🧪",
  "molecular": "🧬",
  "maldi-tof": "⚛️",
  "media-prep": "⚗️",
  "isolate-storage": "🧊",
  "mycology": "🍄",
  "parasitology": "🦟",
  "ipc": "🧼",
  "water": "💧",
  "stores": "📦",
};

export function DashboardPage() {
  // Belt-and-braces re-render: any local or cloud-driven write fires the
  // `amce:db-changed` event. Forcing a tick guarantees the dashboard's derived
  // numbers refresh even if a hook somewhere else is memoising results.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    // Pull the latest cloud state every time the dashboard mounts and whenever
    // the tab regains focus, so cross-device updates show up immediately.
    void refreshFromCloud();
    const onFocus = () => void refreshFromCloud();
    const onChanged = () => tick();
    window.addEventListener("focus", onFocus);
    window.addEventListener("amce:db-changed", onChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("amce:db-changed", onChanged);
    };
  }, []);

  const supplies = useSupplyStatus();
  const batches = useBatches();
  const items = useInventory();
  const tests = useAcceptanceTests();
  const movements = useStockMovements();
  const equipment = useEquipment();
  const durables = useDurables();
  const forecasts = useForecasts();
  const purchaseRequests = usePurchaseRequests();

  const partial = supplies.filter((s) => s.supplyStatus === "Partially supplied").length;
  const pendingProcurement = supplies.filter((s) => s.supplyStatus === "Pending procurement").length;
  const lowStock = items.filter((i) => isLowStock(i, batches)).length;

  const expBuckets = batches.reduce(
    (acc, b) => {
      const k = expiryBucket(b.expiryDate);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pendingAcceptance = tests.filter((t) => t.acceptedOrRejected === "Pending").length
    + batches.filter((b) => b.batchStatus === "Pending acceptance").length;
  const quarantinedRejected = batches.filter((b) => b.batchStatus === "Quarantined" || b.batchStatus === "Rejected").length;
  const criticalRisks = supplies.filter(isCriticalRisk).length;
  const missingDocs = supplies.filter((s) => supplyStatusFlags(s).length > 0).length;

  const maintDue = equipment.filter(isMaintenanceDue).length;
  const calDue = equipment.filter(isCalibrationDue).length;

  const totalActions = buildCriticalActions({ inventory: items, batches, supply: supplies, equipment, forecasts }).length;

  return (
    <div>
      <Header
        title="AMCE Medical Microbiology Lab Command Centre"
        description="Live operational view across supply, inventory, quality and asset readiness."
        helpTopic="dashboard"
        actions={
          <Link
            to="/critical-actions"
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            View {totalActions} critical actions
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="rounded-lg border border-border bg-gradient-to-r from-pink-100 via-amber-100 to-emerald-100 dark:from-pink-500/15 dark:via-amber-500/15 dark:to-emerald-500/15 px-4 py-3 flex items-center gap-3 shadow-sm">
          <span className="text-2xl" aria-hidden>🧫</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-foreground">For AMCE Medical Microbiology</div>
            <div className="text-xs text-muted-foreground">Built by the AMCE Medical Microbiology team ✨</div>
          </div>
        </div>
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Critical actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <DashboardCard label="Critical stock risks" value={criticalRisks} tone="destructive" to="/critical-actions" />
            <DashboardCard label="Pending procurement" value={pendingProcurement} tone="warning" to="/procurement-followup" />
            <DashboardCard label="Partially supplied" value={partial} tone="warning" to="/supply-status" />
            <DashboardCard label="Expired batches" value={expBuckets.expired ?? 0} tone="destructive" to="/expired-wasted-stock" />
            <DashboardCard label="Pending acceptance" value={pendingAcceptance} tone="info" to="/acceptance-testing" />
            <DashboardCard label="Quarantined / rejected" value={quarantinedRejected} tone="destructive" to="/quarantined-stock" />
            <DashboardCard label="Records with missing docs" value={missingDocs} tone="warning" to="/data-quality-review" />
            <DashboardCard
              label="Equipment maintenance / calibration"
              value={maintDue + calDue}
              hint={equipment.length === 0 ? "Equipment register empty" : `${maintDue} maintenance, ${calDue} calibration`}
              tone={maintDue + calDue > 0 ? "warning" : "default"}
              to="/maintenance-calibration"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Operational summaries</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <DashboardCard label="Supply requests" value={supplies.length} to="/supply-status" />
            <DashboardCard label="Inventory items" value={items.length} to="/inventory-master" />
            <DashboardCard label="Low-stock items" value={lowStock} tone={lowStock ? "warning" : "default"} to="/low-stock-reorder" />
            <DashboardCard label="Batch / lot records" value={batches.length} to="/batch-register" />
            <DashboardCard label="Stock movements" value={movements.length} to="/stock-movements" />
            <DashboardCard label="Purchase requests" value={purchaseRequests.length} to="/purchase-requests" />
            <DashboardCard label="Section forecasts" value={forecasts.length} to="/section-forecasting" />
            <DashboardCard label="Equipment assets" value={equipment.length} hint={equipment.length === 0 ? "Pending import" : undefined} to="/equipment-register" />
            <DashboardCard label="Durable assets" value={durables.length} hint={durables.length === 0 ? "Pending import" : undefined} to="/durables-register" />
            <DashboardCard label="Expiring within 30 days" value={expBuckets["30"] ?? 0} tone="warning" to="/expiry-fefo" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Section status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AMCE_SECTIONS.map((s) => {
              const sectionSupplies = supplies.filter((x) => x.laboratorySection === s.id);
              const open = sectionSupplies.filter((x) => x.supplyStatus !== "Supplied" && x.supplyStatus !== "Cancelled").length;
              const critical = sectionSupplies.filter(isCriticalRisk).length;
              const sectionItems = items.filter((i) => i.laboratorySection === s.id);
              const sectionLow = sectionItems.filter((i) => totalAvailableForItem(batches, i.id) <= i.reorderLevel).length;
              const sectionPendingAcc = batches.filter((b) => {
                const it = items.find((i) => i.id === b.inventoryItemId);
                return it?.laboratorySection === s.id && b.batchStatus === "Pending acceptance";
              }).length;
              const sectionExpired = batches.filter((b) => {
                const it = items.find((i) => i.id === b.inventoryItemId);
                return it?.laboratorySection === s.id && (b.batchStatus === "Expired" || expiryBucket(b.expiryDate) === "expired");
              }).length;

              const nextAction =
                critical > 0 && open > 0 ? "Escalate critical supply gaps" :
                sectionExpired > 0 ? "Quarantine and discard expired batches" :
                sectionLow > 0 ? "Raise reorder for low-stock items" :
                sectionPendingAcc > 0 ? "Complete acceptance testing" :
                open > 0 ? "Follow up open supply records" :
                "Bench head: review and clear any outstanding matters";

              return (
                <Link
                  key={s.id}
                  to="/section/$sectionId"
                  params={{ sectionId: s.id }}
                  className="bg-card border border-border rounded-md p-3 hover:shadow-md hover:bg-accent/30 transition-all block"
                  aria-label={`Open ${s.name} attention list`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-start gap-2">
                      <span className="text-2xl leading-none shrink-0" aria-hidden>{SECTION_EMOJI[s.id] ?? "🧪"}</span>
                      <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-0.5">
                        <span>Lead:</span>
                        {s.leads.map((lead, i) => {
                          const palette = [
                            "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
                            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                            "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                            "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
                            "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                            "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
                            "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
                          ];
                          const hash = lead.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                          const cls = palette[hash % palette.length];
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold text-[11px] ${cls}`}
                            >
                              <span aria-hidden>✨</span>
                              {lead}
                            </span>
                          );
                        })}
                      </div>
                      </div>
                    </div>
                    {critical > 0 && <StatusBadge label={`${critical} critical`} tone={toneForCriticality("Critical")} />}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Open supply</span><span className="tabular-nums">{open}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Critical risks</span><span className="tabular-nums">{critical}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Low stock</span><span className="tabular-nums">{sectionLow}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending acceptance</span><span className="tabular-nums">{sectionPendingAcc}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Expired batches</span><span className="tabular-nums">{sectionExpired}</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border text-xs">
                    <span className="text-muted-foreground">Next action: </span>
                    <span className="font-medium">{nextAction}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
