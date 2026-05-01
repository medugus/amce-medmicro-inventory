import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { AMCE_EQUIPMENT } from "@/data/amceAssets";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Header } from "@/components/layout/Header";
import { expiryBucket, isLowStock } from "@/logic/inventory";
import { isCriticalRisk, supplyStatusFlags } from "@/logic/supplyStatus";
import { isCalibrationDue, isMaintenanceDue } from "@/logic/equipment";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";

export function DashboardPage() {
  const supplies = AMCE_SUPPLY_STATUS;
  const batches = AMCE_BATCHES;
  const items = AMCE_INVENTORY_MASTER;
  const tests = AMCE_ACCEPTANCE_TESTS;
  const equipment = AMCE_EQUIPMENT;

  const totalRequests = supplies.length;
  const pendingProcurement = supplies.filter((s) => s.supplyStatus === "Pending procurement").length;
  const supplied = supplies.filter((s) => s.supplyStatus === "Supplied").length;
  const partial = supplies.filter((s) => s.supplyStatus === "Partially supplied").length;
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

  return (
    <div>
      <Header
        title="AMCE Microbiology Operations Dashboard"
        description="Live operational view across supply status, inventory, quality, and asset readiness."
      />
      <div className="p-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Supply &amp; procurement</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <DashboardCard label="Total supply requests" value={totalRequests} />
            <DashboardCard label="Pending procurement" value={pendingProcurement} tone="warning" />
            <DashboardCard label="Supplied" value={supplied} tone="success" />
            <DashboardCard label="Partially supplied" value={partial} tone="warning" />
            <DashboardCard label="Critical stock risks" value={criticalRisks} tone="destructive" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Inventory &amp; expiry</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <DashboardCard label="Inventory items" value={items.length} />
            <DashboardCard label="Low-stock items" value={lowStock} tone={lowStock ? "warning" : "default"} />
            <DashboardCard label="Expired batches" value={expBuckets.expired ?? 0} tone="destructive" />
            <DashboardCard label="Expiring ≤ 30 days" value={expBuckets["30"] ?? 0} tone="warning" />
            <DashboardCard label="Expiring ≤ 60 days" value={expBuckets["60"] ?? 0} tone="info" />
            <DashboardCard label="Expiring ≤ 90 days" value={expBuckets["90"] ?? 0} tone="info" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Quality &amp; assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <DashboardCard label="Pending acceptance" value={pendingAcceptance} tone="info" />
            <DashboardCard label="Quarantined / rejected" value={quarantinedRejected} tone="destructive" />
            <DashboardCard label="Records with missing docs" value={missingDocs} tone="warning" />
            <DashboardCard label="Equipment maintenance due" value={maintDue} hint={equipment.length === 0 ? "Equipment register empty" : undefined} />
            <DashboardCard label="Equipment calibration due" value={calDue} hint={equipment.length === 0 ? "Equipment register empty" : undefined} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Section status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AMCE_SECTIONS.map((s) => {
              const sectionSupplies = supplies.filter((x) => x.laboratorySection === s.id);
              const open = sectionSupplies.filter((x) => x.supplyStatus !== "Supplied" && x.supplyStatus !== "Cancelled").length;
              const critical = sectionSupplies.filter((x) => x.criticality === "Critical").length;
              return (
                <div key={s.id} className="bg-card border border-border rounded-md p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">Lead: {s.leads.join(", ")}</div>
                    </div>
                    {critical > 0 && <StatusBadge label={`${critical} critical`} tone={toneForCriticality("Critical")} />}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {sectionSupplies.length} supply records, {open} open
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
