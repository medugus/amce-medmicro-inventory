import { useMemo, useState } from "react";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForBatchStatus } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysUntilExpiry, expiryBucket } from "@/logic/inventory";
import { NOT_DOCUMENTED } from "@/data/categories";

const ALL = "__all";

export function BatchRegisterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const itemsById = useMemo(() => Object.fromEntries(AMCE_INVENTORY_MASTER.map((i) => [i.id, i])), []);

  const rows = useMemo(() => AMCE_BATCHES.filter((b) => {
    const item = itemsById[b.inventoryItemId];
    const name = item?.itemName ?? "";
    if (search && !`${name} ${b.batchNumber} ${b.lotNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== ALL && b.batchStatus !== statusFilter) return false;
    return true;
  }), [search, statusFilter, itemsById]);

  const statuses = Array.from(new Set(AMCE_BATCHES.map((b) => b.batchStatus)));

  return (
    <div>
      <Header
        title="Batch / Lot Register"
        description="Tracks every received batch by lot, expiry, storage location, acceptance status, and issue eligibility."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search batch, lot, item..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All batch statuses</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Batch / Lot</th>
                  <th className="p-2 text-right">Received</th>
                  <th className="p-2 text-right">Available</th>
                  <th className="p-2">Received on</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2">Storage</th>
                  <th className="p-2">Acceptance</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const item = itemsById[b.inventoryItemId];
                  const days = daysUntilExpiry(b.expiryDate);
                  const bucket = expiryBucket(b.expiryDate);
                  const expTone = bucket === "expired" ? "destructive" : bucket === "30" ? "warning" : bucket === "60" ? "info" : "muted";
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{item?.itemName ?? b.inventoryItemId}</td>
                      <td className="p-2 text-xs">
                        <div>{b.batchNumber}</div>
                        <div className="text-muted-foreground">{b.lotNumber ?? NOT_DOCUMENTED}</div>
                      </td>
                      <td className="p-2 text-right tabular-nums">{b.quantityReceived}</td>
                      <td className="p-2 text-right tabular-nums">{b.quantityAvailable}</td>
                      <td className="p-2 text-xs">{b.dateReceived}</td>
                      <td className="p-2 text-xs">
                        {b.expiryDate ?? NOT_DOCUMENTED}
                        {days !== null && (
                          <div><StatusBadge label={days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`} tone={expTone} /></div>
                        )}
                      </td>
                      <td className="p-2 text-xs">{b.storageLocation}</td>
                      <td className="p-2 text-xs">{b.acceptanceStatus}</td>
                      <td className="p-2"><StatusBadge label={b.batchStatus} tone={toneForBatchStatus(b.batchStatus)} /></td>
                      <td className="p-2 text-xs text-muted-foreground">{b.notes || b.quarantineReason || ""}</td>
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
