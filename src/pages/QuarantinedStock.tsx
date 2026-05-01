import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForBatchStatus } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";

export function QuarantinedStockPage() {
  const inventory = useInventory();
  const batches = useBatches();
  const itemsById = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const rows = batches.filter((b) => b.batchStatus === "Quarantined" || b.batchStatus === "Rejected");

  return (
    <div>
      <Header
        title="Rejected and Quarantined Stock"
        description="Batches held back from issue pending investigation, supplier action, or final disposition."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No batches are currently quarantined or rejected." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Batch / Lot</th>
                  <th className="p-2 text-right">Qty held</th>
                  <th className="p-2">Storage</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const item = itemsById[b.inventoryItemId];
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{item?.itemName ?? b.inventoryItemId}</td>
                      <td className="p-2 text-xs">{item ? SECTION_NAME[item.laboratorySection] : NOT_DOCUMENTED}</td>
                      <td className="p-2 text-xs">{b.batchNumber} / {b.lotNumber ?? NOT_DOCUMENTED}</td>
                      <td className="p-2 text-right tabular-nums">{b.quantityAvailable}</td>
                      <td className="p-2 text-xs">{b.storageLocation}</td>
                      <td className="p-2"><StatusBadge label={b.batchStatus} tone={toneForBatchStatus(b.batchStatus)} /></td>
                      <td className="p-2 text-xs">{b.quarantineReason ?? "Pending confirmation"}</td>
                      <td className="p-2 text-xs">{b.batchStatus === "Quarantined" ? "Investigate, request supplier corrective action" : "Authorise discard or return"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
