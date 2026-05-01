import { useMemo, useState } from "react";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isLowStock, totalAvailableForItem } from "@/logic/inventory";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";

const ALL = "__all";

export function InventoryMasterPage() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState(ALL);
  const inventory = useInventory();
  const batches = useBatches();

  const rows = useMemo(() => inventory.filter((i) => {
    if (search && !`${i.itemName} ${i.category} ${i.manufacturer ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (section !== ALL && i.laboratorySection !== section) return false;
    return true;
  }), [search, section, inventory]);

  return (
    <div>
      <Header
        title="Inventory Master"
        description="Confirmed catalogue items used by AMCE Microbiology. Catalogue presence does not imply usable stock."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, manufacturer..." />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Manufacturer</th>
                  <th className="p-2">Cat. No.</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 text-right">Available</th>
                  <th className="p-2 text-right">Reorder</th>
                  <th className="p-2">Storage</th>
                  <th className="p-2">Crit.</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const avail = totalAvailableForItem(batches, i.id);
                  const low = isLowStock(i, batches);
                  return (
                    <tr key={i.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{i.itemName}</td>
                      <td className="p-2 text-xs">{i.category}</td>
                      <td className="p-2 text-xs">{SECTION_NAME[i.laboratorySection]}</td>
                      <td className="p-2 text-xs">{i.manufacturer ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.catalogueNumber ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.unitOfIssue}</td>
                      <td className="p-2 text-right tabular-nums">{avail}</td>
                      <td className="p-2 text-right tabular-nums">{i.reorderLevel}</td>
                      <td className="p-2 text-xs">{i.storageCondition}</td>
                      <td className="p-2"><StatusBadge label={i.criticality} tone={toneForCriticality(i.criticality)} /></td>
                      <td className="p-2">
                        {low ? <StatusBadge label="Below reorder level" tone="warning" /> : <StatusBadge label="Adequate" tone="success" />}
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
