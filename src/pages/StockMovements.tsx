import { useMemo, useState } from "react";
import { AMCE_STOCK_MOVEMENTS } from "@/data/amceStockMovements";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { fefoBatches, isBatchIssuable, validateMovement } from "@/logic/inventory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TYPES = ["Receive", "Issue", "Transfer", "Adjust", "Discard", "Return", "Quarantine", "Release from quarantine"] as const;

export function StockMovementsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const itemsById = useMemo(() => Object.fromEntries(AMCE_INVENTORY_MASTER.map((i) => [i.id, i])), []);
  const batchesById = useMemo(() => Object.fromEntries(AMCE_BATCHES.map((b) => [b.id, b])), []);

  // Form state (simulated; movements list is read-only seed)
  const [movementType, setMovementType] = useState<typeof TYPES[number]>("Issue");
  const [itemId, setItemId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [authorisedBy, setAuthorisedBy] = useState<string>("");
  const [validation, setValidation] = useState<string | null>(null);

  const fefo = itemId ? fefoBatches(AMCE_BATCHES, itemId) : [];

  function tryValidate() {
    const b = batchesById[batchId];
    if (!b) { setValidation("Select a batch."); return; }
    const err = validateMovement(
      { movementType, quantity: Number(quantity || 0), reason, authorisedBy: authorisedBy || null },
      b
    );
    setValidation(err ?? "Validation passed. (Persistence not yet enabled.)");
  }

  const rows = AMCE_STOCK_MOVEMENTS.filter((m) => {
    if (!search) return true;
    const item = itemsById[m.inventoryItemId];
    return `${item?.itemName ?? ""} ${m.movementType} ${m.referenceNumber ?? ""} ${m.performedBy}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <Header
        title="Stock Movements"
        description="Receipt, issue, transfer, adjustment, discard, quarantine, and release. FEFO is recommended on issue and negative balances are blocked."
        actions={
          <div className="flex items-center gap-2">
            <ExportButton />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm">Record movement</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Record stock movement</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Movement type</Label>
                    <Select value={movementType} onValueChange={(v) => setMovementType(v as typeof TYPES[number])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Inventory item</Label>
                    <Select value={itemId} onValueChange={(v) => { setItemId(v); setBatchId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>{AMCE_INVENTORY_MASTER.map((i) => <SelectItem key={i.id} value={i.id}>{i.itemName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {itemId && (
                    <div>
                      <Label className="text-xs">Batch (FEFO recommended top of list)</Label>
                      <Select value={batchId} onValueChange={setBatchId}>
                        <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                        <SelectContent>
                          {fefo.length > 0 ? fefo.map((b, idx) => (
                            <SelectItem key={b.id} value={b.id}>
                              {idx === 0 ? "★ " : ""}{b.batchNumber} — exp {b.expiryDate ?? "Not documented"} — avail {b.quantityAvailable}
                            </SelectItem>
                          )) : (
                            AMCE_BATCHES.filter((b) => b.inventoryItemId === itemId).map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.batchNumber} — {isBatchIssuable(b).reason ?? "available"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Authorised by</Label>
                      <Input value={authorisedBy} onChange={(e) => setAuthorisedBy(e.target.value)} placeholder="Officer name" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Reason</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for adjustments and discards" />
                  </div>
                  {validation && <div className="text-xs p-2 rounded-md bg-muted">{validation}</div>}
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Close</Button><Button onClick={tryValidate}>Validate</Button></div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search movements..." />
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Date / time</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Batch</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2">From</th>
                  <th className="p-2">To</th>
                  <th className="p-2">By</th>
                  <th className="p-2">Authorised</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Ref.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const item = itemsById[m.inventoryItemId];
                  const batch = batchesById[m.batchId];
                  return (
                    <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 text-xs">{new Date(m.dateTime).toLocaleString()}</td>
                      <td className="p-2"><StatusBadge label={m.movementType} tone={m.movementType === "Issue" ? "info" : m.movementType === "Quarantine" || m.movementType === "Discard" ? "destructive" : "neutral"} /></td>
                      <td className="p-2">{item?.itemName ?? m.inventoryItemId}</td>
                      <td className="p-2 text-xs">{batch?.batchNumber ?? m.batchId}</td>
                      <td className="p-2 text-right tabular-nums">{m.quantity}</td>
                      <td className="p-2 text-xs">{m.fromSection ? SECTION_NAME[m.fromSection] : "—"}</td>
                      <td className="p-2 text-xs">{m.toSection ? SECTION_NAME[m.toSection] : "—"}</td>
                      <td className="p-2 text-xs">{m.performedBy}</td>
                      <td className="p-2 text-xs">{m.authorisedBy ?? ""}</td>
                      <td className="p-2 text-xs">{m.reason}</td>
                      <td className="p-2 text-xs">{m.referenceNumber ?? ""}</td>
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
