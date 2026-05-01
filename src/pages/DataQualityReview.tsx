import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
import { SECTION_NAME } from "@/data/amceSections";
import { actionRequired, supplyStatusFlags } from "@/logic/supplyStatus";

export function DataQualityReviewPage() {
  const rows = AMCE_SUPPLY_STATUS
    .map((r) => ({ r, flags: supplyStatusFlags(r) }))
    .filter((x) => x.flags.length > 0);

  return (
    <div>
      <Header
        helpTopic="dataQuality"
        title="Data Quality Review"
        description="Records flagged for missing or inconsistent documentation. Resolve before further procurement or stock action."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No data-quality flags raised on supply records." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Responsible</th>
                  <th className="p-2">Supply status</th>
                  <th className="p-2">Flags</th>
                  <th className="p-2">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, flags }) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{r.itemName}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[r.laboratorySection]}</td>
                    <td className="p-2 text-xs">{r.responsiblePerson}</td>
                    <td className="p-2 text-xs">{r.supplyStatus}</td>
                    <td className="p-2">
                      <div className="flex flex-col gap-0.5">
                        {flags.map((f, i) => <StatusBadge key={i} label={f.message} tone="warning" />)}
                      </div>
                    </td>
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
