import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { SECTION_NAME, AMCE_SECTIONS } from "@/data/amceSections";
import { totalAvailableForItem } from "@/logic/inventory";

export function LowStockReorderPage() {
  const rows = AMCE_INVENTORY_MASTER
    .map((i) => ({ item: i, available: totalAvailableForItem(AMCE_BATCHES, i.id) }))
    .filter((r) => r.available <= r.item.reorderLevel)
    .sort((a, b) => (a.available - a.item.reorderLevel) - (b.available - b.item.reorderLevel));

  const lead = (id: string) => AMCE_SECTIONS.find((s) => s.id === id)?.leads.join(", ") ?? "Pending assignment";

  return (
    <div>
      <Header
        title="Low Stock and Reorder"
        description="Catalogue items where usable stock from accepted, non-expired batches is at or below reorder level."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No items below reorder level." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Section lead</th>
                  <th className="p-2 text-right">Available</th>
                  <th className="p-2 text-right">Reorder</th>
                  <th className="p-2 text-right">Min</th>
                  <th className="p-2 text-right">Max</th>
                  <th className="p-2 text-right">Suggested order</th>
                  <th className="p-2">Crit.</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, available }) => {
                  const suggested = Math.max(item.maximumStock - available, item.reorderLevel - available);
                  return (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-xs">{SECTION_NAME[item.laboratorySection]}</td>
                      <td className="p-2 text-xs">{lead(item.laboratorySection)}</td>
                      <td className="p-2 text-right tabular-nums">{available}</td>
                      <td className="p-2 text-right tabular-nums">{item.reorderLevel}</td>
                      <td className="p-2 text-right tabular-nums">{item.minimumStock}</td>
                      <td className="p-2 text-right tabular-nums">{item.maximumStock}</td>
                      <td className="p-2 text-right tabular-nums">{suggested}</td>
                      <td className="p-2"><StatusBadge label={item.criticality} tone={toneForCriticality(item.criticality)} /></td>
                      <td className="p-2">
                        {available === 0
                          ? <StatusBadge label="Stock-out" tone="destructive" />
                          : <StatusBadge label="Below reorder level" tone="warning" />}
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
