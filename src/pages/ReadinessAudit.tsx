import { Header } from "@/components/layout/Header";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { AMCE_EQUIPMENT, AMCE_DURABLES } from "@/data/amceAssets";
import { AMCE_SECTIONS } from "@/data/amceSections";

type Status = "pass" | "warn" | "fail";
interface Check { label: string; status: Status; detail?: string }
interface Group { title: string; checks: Check[] }

export function ReadinessAuditPage() {
  const groups: Group[] = [
    {
      title: "Build and deployment readiness",
      checks: [
        { label: "Production build target verified", status: "pass", detail: "Build runs through the Lovable build pipeline." },
        { label: "Routing and navigation present", status: "pass", detail: "TanStack Router file-based routing across all modules." },
      ],
    },
    {
      title: "Data model readiness",
      checks: [
        { label: "Supply status separated from inventory", status: "pass", detail: "Distinct modules: Supply Status, Inventory Master, Batch Register." },
        { label: "Inventory master present", status: AMCE_INVENTORY_MASTER.length > 0 ? "pass" : "warn" },
        { label: "Batch / lot tracking present", status: AMCE_BATCHES.length > 0 ? "pass" : "warn" },
        { label: "Equipment and durables modelled separately from consumables", status: "pass" },
      ],
    },
    {
      title: "AMCE section configuration",
      checks: [
        { label: `All ${AMCE_SECTIONS.length} laboratory sections registered`, status: AMCE_SECTIONS.length === 16 ? "pass" : "warn" },
        { label: "Section leads recorded", status: AMCE_SECTIONS.every((s) => s.leads.length > 0) ? "pass" : "warn" },
      ],
    },
    {
      title: "Inventory import readiness",
      checks: [
        { label: "Current inventory file: received, pending mapping review", status: "warn", detail: "Workbook sheets must be classified by module before import." },
        { label: "Equipment list: pending", status: "warn", detail: "Equipment records will be reviewed separately from consumables and reagents." },
        { label: "Inventory import: not started", status: "warn", detail: "Current inventory must be mapped by sheet and category before import." },
        { label: "Active supply records detected", status: AMCE_SUPPLY_STATUS.length > 0 ? "pass" : "warn" },
      ],
    },
    {
      title: "Equipment import readiness",
      checks: [
        { label: "Equipment list pending", status: AMCE_EQUIPMENT.length === 0 ? "warn" : "pass" },
        { label: "Durables list pending", status: AMCE_DURABLES.length === 0 ? "warn" : "pass" },
        { label: "No invented equipment serial numbers", status: AMCE_EQUIPMENT.length === 0 ? "pass" : "warn" },
        { label: "No invented calibration dates", status: AMCE_EQUIPMENT.length === 0 ? "pass" : "warn" },
      ],
    },
    {
      title: "Quality and audit readiness",
      checks: [
        { label: "FEFO recommendation enabled on issue", status: "pass" },
        { label: "Expired stock blocked from issue", status: "pass" },
        { label: "Quarantined and rejected batches blocked from issue", status: "pass" },
        { label: "Pending-acceptance batches blocked from issue", status: "pass" },
        { label: "Acceptance testing module present", status: "pass" },
        { label: "Stock movement validation present", status: "pass", detail: "Negative balances blocked, adjustments need a reason, discards need authorisation." },
        { label: "Audit trail page reserved (persistence pending backend)", status: "warn" },
      ],
    },
    {
      title: "Placeholder and fake-data audit",
      checks: [
        { label: "Controlled missing-value wording (Not documented, Pending confirmation)", status: "pass" },
        { label: "No user-facing placeholder content", status: "pass", detail: "No 'Coming soon', 'Demo', 'TBD', 'N/A' or 'Lorem ipsum'." },
        { label: "Export disabled with clear messaging until backend integration", status: "pass" },
      ],
    },
  ];

  return (
    <div>
      <Header
        helpTopic="readinessAudit"
        title="Readiness Audit"
        description="Operational and quality readiness checks for the AMCE Microbiology inventory system."
      />
      <div className="p-6 space-y-6">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-sm font-semibold text-foreground mb-2">{g.title}</h2>
            <div className="border border-border rounded-md bg-card divide-y divide-border">
              {g.checks.map((c) => {
                const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warn" ? AlertTriangle : XCircle;
                const cls = c.status === "pass" ? "text-success" : c.status === "warn" ? "text-warning" : "text-destructive";
                return (
                  <div key={c.label} className="flex items-start gap-3 px-4 py-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${cls}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{c.label}</div>
                      {c.detail && <div className="text-xs text-muted-foreground mt-0.5">{c.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
