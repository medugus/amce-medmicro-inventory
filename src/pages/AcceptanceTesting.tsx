import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";

export function AcceptanceTestingPage() {
  const rows = AMCE_ACCEPTANCE_TESTS;
  return (
    <div>
      <Header
        title="Acceptance Testing"
        description="Receipt checks and QC for critical reagents, kits, cartridges, media, stains, discs and QC materials. Items cannot be issued until accepted."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Lot</th>
                  <th className="p-2">Received</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2">Physical</th>
                  <th className="p-2">COA</th>
                  <th className="p-2">QC</th>
                  <th className="p-2">Decision</th>
                  <th className="p-2">By</th>
                  <th className="p-2">Comments / corrective action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{t.itemName}</td>
                    <td className="p-2 text-xs">{t.lotNumber ?? "Not documented"}</td>
                    <td className="p-2 text-xs">{t.dateReceived}</td>
                    <td className="p-2 text-xs">{t.expiryDate ?? "Not documented"}</td>
                    <td className="p-2 text-xs">{t.physicalCondition}</td>
                    <td className="p-2 text-xs">{t.certificateOfAnalysisAvailable ? "Yes" : "No"}</td>
                    <td className="p-2 text-xs">{t.qcResult}</td>
                    <td className="p-2">
                      <StatusBadge
                        label={t.acceptedOrRejected}
                        tone={t.acceptedOrRejected === "Accepted" ? "success" : t.acceptedOrRejected === "Rejected" ? "destructive" : "info"}
                      />
                    </td>
                    <td className="p-2 text-xs">{t.acceptedBy ?? ""}</td>
                    <td className="p-2 text-xs">{t.comments}{t.correctiveActionIfRejected ? ` — ${t.correctiveActionIfRejected}` : ""}</td>
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
