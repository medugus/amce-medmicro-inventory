import { AMCE_PURCHASE_REQUESTS } from "@/data/amceForecasts";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality, toneForProcurementStatus } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";

export function PurchaseRequestsPage() {
  const rows = AMCE_PURCHASE_REQUESTS;
  return (
    <div>
      <Header
        title="Purchase Requests"
        description="Section-initiated procurement requests with workflow status, approval and procurement tracking."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Requested by</th>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Current</th>
                  <th className="p-2 text-right">Avg/mo</th>
                  <th className="p-2">Urgency</th>
                  <th className="p-2">Approval</th>
                  <th className="p-2">Procurement</th>
                  <th className="p-2">Justification</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 text-xs">{r.requestDate}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[r.requestingSection]}</td>
                    <td className="p-2 text-xs">{r.requestedBy}</td>
                    <td className="p-2 font-medium">{r.itemName}</td>
                    <td className="p-2 text-right tabular-nums">{r.quantityRequested}</td>
                    <td className="p-2 text-right tabular-nums">{r.currentStock}</td>
                    <td className="p-2 text-right tabular-nums">{r.averageMonthlyUsage}</td>
                    <td className="p-2"><StatusBadge label={r.urgency} tone={toneForCriticality(r.urgency)} /></td>
                    <td className="p-2"><StatusBadge label={r.approvalStatus} tone={r.approvalStatus === "Approved" ? "success" : r.approvalStatus === "Rejected" ? "destructive" : "info"} /></td>
                    <td className="p-2"><StatusBadge label={r.procurementStatus} tone={toneForProcurementStatus(r.procurementStatus)} /></td>
                    <td className="p-2 text-xs">{r.justification || NOT_DOCUMENTED}</td>
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
