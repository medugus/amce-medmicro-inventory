import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { PrintButton } from "@/components/common/PrintButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { daysUntilExpiry, expiryBucket } from "@/logic/inventory";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";

export function ExpiredWastedStockPage() {
  const inventory = useInventory();
  const batches = useBatches();
  const itemsById = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const rows = batches.filter((b) => b.batchStatus === "Expired" || b.batchStatus === "Discarded" || expiryBucket(b.expiryDate) === "expired");

  return (
    <div>
      <Header
        helpTopic="expiredWasted"
        title="Expired and Wasted Stock"
        description="Batches that have expired or been discarded. Used for wastage tracking and supplier feedback."
        actions={<><PrintButton label="Print expired list" /><ExportButton /></>}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No expired or wasted batches recorded." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Batch / Lot</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2 text-right">Qty wasted</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const item = itemsById[b.inventoryItemId];
                  const days = daysUntilExpiry(b.expiryDate);
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{item?.itemName ?? b.inventoryItemId}</td>
                      <td className="p-2 text-xs">{item ? SECTION_NAME[item.laboratorySection] : NOT_DOCUMENTED}</td>
                      <td className="p-2 text-xs">{b.batchNumber} / {b.lotNumber ?? NOT_DOCUMENTED}</td>
                      <td className="p-2 text-xs">
                        {b.expiryDate ?? NOT_DOCUMENTED}
                        {days !== null && days < 0 && <span className="text-muted-foreground"> ({Math.abs(days)}d ago)</span>}
                      </td>
                      <td className="p-2 text-right tabular-nums">{b.quantityAvailable}</td>
                      <td className="p-2"><StatusBadge label={b.batchStatus} tone="destructive" /></td>
                      <td className="p-2 text-xs">{b.notes || "Pending discard authorisation"}</td>
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
