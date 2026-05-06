import { AMCE_MAINTENANCE, AMCE_CALIBRATION } from "@/data/amceAssets";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ExportButton } from "@/components/common/ExportButton";
import { isCriticalRisk, supplyStatusFlags } from "@/logic/supplyStatus";
import { expiryBucket, isLowStock } from "@/logic/inventory";
import {
  useInventory,
  useBatches,
  useSupplyStatus,
  useStockMovements,
  useAcceptanceTests,
  useEquipment,
  useDurables,
  useForecasts,
  usePurchaseRequests,
} from "@/lib/useLiveData";

interface ReportTile {
  title: string;
  value: number;
  hint?: string;
  tone?: "warning" | "destructive" | "info" | "success";
}

export function ReportsPage() {
  const inventory = useInventory();
  const batches = useBatches();
  const supplies = useSupplyStatus();
  const movements = useStockMovements();
  const acceptance = useAcceptanceTests();
  const equipment = useEquipment();
  const durables = useDurables();
  const forecasts = useForecasts();
  const purchaseRequests = usePurchaseRequests();

  const lowStock = inventory.filter((i) => isLowStock(i, batches)).length;
  const expired = batches.filter((b) => expiryBucket(b.expiryDate) === "expired" || b.batchStatus === "Expired").length;
  const dq = supplies.filter((s) => supplyStatusFlags(s).length > 0).length;
  const critical = supplies.filter(isCriticalRisk).length;

  const sections: { title: string; reports: ReportTile[] }[] = [
    {
      title: "Inventory reports",
      reports: [
        { title: "Inventory catalogue", value: inventory.length, hint: "Confirmed catalogue items" },
        { title: "Batch / lot register", value: batches.length, hint: "Tracked batches" },
        { title: "Stock movements", value: movements.length, hint: "Logged movements" },
        { title: "Low-stock items", value: lowStock, hint: "At or below reorder level", tone: "warning" },
        { title: "Expired batches", value: expired, hint: "Expired or past use-by", tone: "destructive" },
      ],
    },
    {
      title: "Procurement reports",
      reports: [
        { title: "Supply-status records", value: supplies.length, hint: "All tracked records" },
        { title: "Critical stock risks", value: critical, hint: "Risk-scored items", tone: "destructive" },
        { title: "Purchase requests", value: purchaseRequests.length, hint: "Submitted to procurement" },
        { title: "Section forecasts", value: forecasts.length, hint: "Three-month forecasts" },
      ],
    },
    {
      title: "Quality reports",
      reports: [
        { title: "Acceptance testing records", value: acceptance.length, hint: "All decisions" },
        { title: "Quarantined / rejected batches", value: batches.filter((b) => b.batchStatus === "Quarantined" || b.batchStatus === "Rejected").length, tone: "destructive" },
        { title: "Data quality flags", value: dq, hint: "Records with missing documentation", tone: "warning" },
      ],
    },
    {
      title: "Equipment and asset reports",
      reports: [
        { title: "Equipment register", value: equipment.length, hint: equipment.length === 0 ? "Equipment list pending" : undefined },
        { title: "Durables register", value: durables.length, hint: durables.length === 0 ? "Durables list pending" : undefined },
        { title: "Maintenance records", value: AMCE_MAINTENANCE.length, hint: "Pending equipment import" },
        { title: "Calibration records", value: AMCE_CALIBRATION.length, hint: "Pending equipment import" },
      ],
    },
    {
      title: "Section reports",
      reports: AMCE_SECTIONS.map((s) => ({
        title: s.name,
        value: supplies.filter((r) => r.laboratorySection === s.id).length,
        hint: `Lead: ${s.leads.join(", ")}`,
      })),
    },
  ];

  return (
    <div>
      <Header
        helpTopic="reports"
        title="Reports"
        description="All values are calculated from current data. Export will be enabled after database integration."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-sm font-semibold text-foreground mb-2">{s.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {s.reports.map((r) => (
                <DashboardCard key={r.title} label={r.title} value={r.value} hint={r.hint} tone={r.tone} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
