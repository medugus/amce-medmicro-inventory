import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_FORECASTS, AMCE_PURCHASE_REQUESTS } from "@/data/amceForecasts";
import { AMCE_STOCK_MOVEMENTS } from "@/data/amceStockMovements";
import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { AMCE_EQUIPMENT, AMCE_MAINTENANCE, AMCE_CALIBRATION, AMCE_DURABLES } from "@/data/amceAssets";
import { Header } from "@/components/layout/Header";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ExportButton } from "@/components/common/ExportButton";
import { isCriticalRisk, supplyStatusFlags } from "@/logic/supplyStatus";
import { expiryBucket, isLowStock } from "@/logic/inventory";

export function ReportsPage() {
  const lowStock = AMCE_INVENTORY_MASTER.filter((i) => isLowStock(i, AMCE_BATCHES)).length;
  const expired = AMCE_BATCHES.filter((b) => expiryBucket(b.expiryDate) === "expired").length;
  const dq = AMCE_SUPPLY_STATUS.filter((s) => supplyStatusFlags(s).length > 0).length;
  const critical = AMCE_SUPPLY_STATUS.filter(isCriticalRisk).length;

  const reports = [
    { title: "Current inventory report", value: AMCE_INVENTORY_MASTER.length, hint: "Catalogue items" },
    { title: "Supply-status report", value: AMCE_SUPPLY_STATUS.length, hint: "Active records" },
    { title: "Low-stock report", value: lowStock, hint: "Items at or below reorder level", tone: "warning" as const },
    { title: "Expiry report", value: expired, hint: "Expired batches", tone: "destructive" as const },
    { title: "Batch register report", value: AMCE_BATCHES.length, hint: "Tracked batches" },
    { title: "Stock movement report", value: AMCE_STOCK_MOVEMENTS.length, hint: "Logged movements" },
    { title: "Acceptance testing report", value: AMCE_ACCEPTANCE_TESTS.length, hint: "Acceptance records" },
    { title: "Section forecast report", value: AMCE_FORECASTS.length, hint: "3-month forecasts" },
    { title: "Critical stock risk report", value: critical, hint: "Risk-scored items", tone: "destructive" as const },
    { title: "Purchase request report", value: AMCE_PURCHASE_REQUESTS.length, hint: "Active requests" },
    { title: "Equipment register report", value: AMCE_EQUIPMENT.length, hint: "Real records pending import" },
    { title: "Durables report", value: AMCE_DURABLES.length, hint: "Real records pending import" },
    { title: "Maintenance due report", value: AMCE_MAINTENANCE.length, hint: "Records pending equipment import" },
    { title: "Calibration due report", value: AMCE_CALIBRATION.length, hint: "Records pending equipment import" },
    { title: "Data quality report", value: dq, hint: "Records with flags", tone: "warning" as const },
  ];

  return (
    <div>
      <Header
        title="Reports"
        description="All values are calculated from current data. Export will be enabled after database integration."
        actions={<ExportButton />}
      />
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {reports.map((r) => (
            <DashboardCard key={r.title} label={r.title} value={r.value} hint={r.hint} tone={r.tone} />
          ))}
        </div>
      </div>
    </div>
  );
}
