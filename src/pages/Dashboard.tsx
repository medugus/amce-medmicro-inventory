import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { AMCE_EQUIPMENT, AMCE_DURABLES } from "@/data/amceAssets";
import { AMCE_FORECASTS, AMCE_PURCHASE_REQUESTS } from "@/data/amceForecasts";
import { AMCE_STOCK_MOVEMENTS } from "@/data/amceStockMovements";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Header } from "@/components/layout/Header";
import { expiryBucket, isLowStock, totalAvailableForItem } from "@/logic/inventory";
import { isCriticalRisk, supplyStatusFlags } from "@/logic/supplyStatus";
import { isCalibrationDue, isMaintenanceDue } from "@/logic/equipment";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { buildCriticalActions } from "@/logic/criticalActions";
import { Link } from "@tanstack/react-router";

export function DashboardPage() {
  const supplies = AMCE_SUPPLY_STATUS;
  const batches = AMCE_BATCHES;
  const items = AMCE_INVENTORY_MASTER;
  const tests = AMCE_ACCEPTANCE_TESTS;
  const equipment = AMCE_EQUIPMENT;

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

  const totalActions = buildCriticalActions().length;

  return (
    <div>
      <Header
        title="AMCE Microbiology Command Centre"
        description="Live operational view across supply, inventory, quality and asset readiness."
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
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Next operational task</h2>
          <div className="bg-card border border-border rounded-md p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Prepare current inventory import mapping</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                  Current inventory file has been received. The next step is to map each workbook sheet to the correct module before importing data.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <StatusBadge label="Pending inventory mapping approval" tone="warning" />
                <span className="text-muted-foreground">Owner: <span className="font-medium text-foreground">Dr Medugu</span></span>
              </div>
            </div>
            <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs list-decimal list-inside text-foreground">
              <li>Confirm workbook sheet names.</li>
              <li>Classify each sheet as Supply Status, Inventory Master, Batch/Lot Register, Usage History, Purchase Planning, Durables, Equipment, Forecasting, or Expired/Wasted Stock.</li>
              <li>Identify missing critical fields.</li>
              <li>Confirm which rows represent usable stock.</li>
              <li>Confirm which rows are only requests or pending procurement.</li>
              <li>Do not import requested or pending items as usable stock.</li>
              <li>Wait for equipment list before final import.</li>
              <li>Import only after build and deployment checks are green.</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Critical actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <DashboardCard label="Critical stock risks" value={criticalRisks} tone="destructive" />
            <DashboardCard label="Pending procurement" value={pendingProcurement} tone="warning" />
            <DashboardCard label="Partially supplied" value={partial} tone="warning" />
            <DashboardCard label="Expired batches" value={expBuckets.expired ?? 0} tone="destructive" />
            <DashboardCard label="Pending acceptance" value={pendingAcceptance} tone="info" />
            <DashboardCard label="Quarantined / rejected" value={quarantinedRejected} tone="destructive" />
            <DashboardCard label="Records with missing docs" value={missingDocs} tone="warning" />
            <DashboardCard
              label="Equipment maintenance / calibration"
              value={maintDue + calDue}
              hint={equipment.length === 0 ? "Equipment register empty" : `${maintDue} maintenance, ${calDue} calibration`}
              tone={maintDue + calDue > 0 ? "warning" : "default"}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Operational summaries</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <DashboardCard label="Supply requests" value={supplies.length} />
            <DashboardCard label="Inventory items" value={items.length} />
            <DashboardCard label="Low-stock items" value={lowStock} tone={lowStock ? "warning" : "default"} />
            <DashboardCard label="Batch / lot records" value={batches.length} />
            <DashboardCard label="Stock movements" value={AMCE_STOCK_MOVEMENTS.length} />
            <DashboardCard label="Purchase requests" value={AMCE_PURCHASE_REQUESTS.length} />
            <DashboardCard label="Section forecasts" value={AMCE_FORECASTS.length} />
            <DashboardCard label="Equipment assets" value={equipment.length} hint={equipment.length === 0 ? "Pending import" : undefined} />
            <DashboardCard label="Durable assets" value={AMCE_DURABLES.length} hint={AMCE_DURABLES.length === 0 ? "Pending import" : undefined} />
            <DashboardCard label="Expiring within 30 days" value={expBuckets["30"] ?? 0} tone="warning" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Section status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AMCE_SECTIONS.map((s) => {
              const sectionSupplies = supplies.filter((x) => x.laboratorySection === s.id);
              const open = sectionSupplies.filter((x) => x.supplyStatus !== "Supplied" && x.supplyStatus !== "Cancelled").length;
              const critical = sectionSupplies.filter((x) => x.criticality === "Critical").length;
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
                "No action required";

              return (
                <div key={s.id} className="bg-card border border-border rounded-md p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">Lead: {s.leads.join(", ")}</div>
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
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
