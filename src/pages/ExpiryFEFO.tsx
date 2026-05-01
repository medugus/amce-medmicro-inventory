import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { daysUntilExpiry, expiryBucket, fefoBatches, isBatchIssuable } from "@/logic/inventory";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";

export function ExpiryFEFOPage() {
  const inventory = useInventory();
  const batches = useBatches();
  const itemsById = Object.fromEntries(inventory.map((i) => [i.id, i]));

  const rows = [...batches].sort((a, b) => {
    const ax = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
    const bx = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
    return ax - bx;
  });

  // FEFO order per item (top batch is recommended next-issue)
  const fefoTopByItem = new Map<string, string>();
  for (const item of inventory) {
    const ordered = fefoBatches(batches, item.id);
    if (ordered.length > 0) fefoTopByItem.set(item.id, ordered[0].id);
  }

  return (
    <div>
      <Header
        title="Expiry and FEFO"
        description="Batches sorted by expiry. The first eligible batch per item is flagged for first-expiry-first-out issue."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Batch / Lot</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2 text-right">Days</th>
                  <th className="p-2 text-right">Available</th>
                  <th className="p-2">Eligibility</th>
                  <th className="p-2">FEFO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const item = itemsById[b.inventoryItemId];
                  const days = daysUntilExpiry(b.expiryDate);
                  const bucket = expiryBucket(b.expiryDate);
                  const tone = bucket === "expired" ? "destructive" : bucket === "30" ? "warning" : bucket === "60" ? "info" : "muted";
                  const elig = isBatchIssuable(b);
                  const fefoTop = item && fefoTopByItem.get(item.id) === b.id;
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{item?.itemName ?? b.inventoryItemId}</td>
                      <td className="p-2 text-xs">{item ? SECTION_NAME[item.laboratorySection] : NOT_DOCUMENTED}</td>
                      <td className="p-2 text-xs">{b.batchNumber} / {b.lotNumber ?? NOT_DOCUMENTED}</td>
                      <td className="p-2 text-xs">{b.expiryDate ?? NOT_DOCUMENTED}</td>
                      <td className="p-2 text-right tabular-nums">
                        {days === null ? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span> :
                          <StatusBadge label={days < 0 ? `Expired ${Math.abs(days)}d` : `${days}d`} tone={tone} />}
                      </td>
                      <td className="p-2 text-right tabular-nums">{b.quantityAvailable}</td>
                      <td className="p-2 text-xs">
                        {elig.ok
                          ? <StatusBadge label="Eligible for issue" tone="success" />
                          : <StatusBadge label={elig.reason ?? "Not eligible"} tone="warning" />}
                      </td>
                      <td className="p-2 text-xs">
                        {fefoTop ? <StatusBadge label="Issue next (FEFO)" tone="info" /> : ""}
                      </td>
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
