import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality, toneForProcurementStatus, toneForSupplyStatus } from "@/components/common/StatusBadge";
import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { SECTION_NAME } from "@/data/amceSections";
import { actionRequired } from "@/logic/supplyStatus";
import { NOT_DOCUMENTED } from "@/data/categories";

const FOLLOWUP_STATUSES = ["Pending procurement", "Ordered", "Partially supplied", "Delayed", "Requires clarification", "Not supplied"];

export function ProcurementFollowupPage() {
  const rows = AMCE_SUPPLY_STATUS
    .filter((r) => FOLLOWUP_STATUSES.includes(r.supplyStatus))
    .sort((a, b) => {
      const order = ["Critical", "High", "Medium", "Low"];
      return order.indexOf(a.criticality) - order.indexOf(b.criticality);
    });

  return (
    <div>
      <Header
        helpTopic="procurementFollowup"
        title="Procurement Follow-up"
        description="Open procurement workstream: items that are not yet supplied or are awaiting clarification, action or escalation."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No open procurement items requiring follow-up." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Responsible</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Supply status</th>
                  <th className="p-2">Procurement status</th>
                  <th className="p-2">Date requested</th>
                  <th className="p-2">Date ordered</th>
                  <th className="p-2">Crit.</th>
                  <th className="p-2">Action required</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{r.itemName}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[r.laboratorySection]}</td>
                    <td className="p-2 text-xs">{r.responsiblePerson}</td>
                    <td className="p-2 text-xs">{r.supplier ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                    <td className="p-2"><StatusBadge label={r.supplyStatus} tone={toneForSupplyStatus(r.supplyStatus)} /></td>
                    <td className="p-2"><StatusBadge label={r.procurementStatus} tone={toneForProcurementStatus(r.procurementStatus)} /></td>
                    <td className="p-2 text-xs">{r.dateRequested ?? NOT_DOCUMENTED}</td>
                    <td className="p-2 text-xs">{r.dateOrdered ?? NOT_DOCUMENTED}</td>
                    <td className="p-2"><StatusBadge label={r.criticality} tone={toneForCriticality(r.criticality)} /></td>
                    <td className="p-2 text-xs">{actionRequired(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
