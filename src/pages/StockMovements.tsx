import { useMemo, useState } from "react";
import { Plus, PackagePlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { fefoBatches, isBatchIssuable } from "@/logic/inventory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItemPicker } from "@/components/forms/InventoryItemPicker";
import { ReceiveBatchDialog } from "@/components/forms/ReceiveBatchDialog";
import { useBatches, useInventory, useStockMovements, useDataReady } from "@/lib/useLiveData";
import { recordMovement } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";

const TYPES = ["Receive", "Issue", "Transfer", "Adjust", "Discard", "Return", "Quarantine", "Release from quarantine"] as const;

export function StockMovementsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ready = useDataReady();
  const inventory = useInventory();
  const batches = useBatches();
  const movements = useStockMovements();

  const itemsById = useMemo(() => Object.fromEntries(inventory.map((i) => [i.id, i])), [inventory]);
  const batchesById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches]);

  const [movementType, setMovementType] = useState<typeof TYPES[number]>("Issue");
  const [itemId, setItemId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [authorisedBy, setAuthorisedBy] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fefo = itemId ? fefoBatches(batches, itemId) : [];

  function resetForm() {
    setMovementType("Issue");
    setItemId("");
    setBatchId("");
    setQuantity("");
    setReason("");
    setAuthorisedBy("");
  }

  async function handleSave() {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Select a user in the top bar before recording movements.");
      return;
    }
    if (!itemId || !batchId) { toast.error("Select an item and a batch."); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error("Enter a quantity greater than zero."); return; }

    setSubmitting(true);
    try {
      const b = batchesById[batchId];
      await recordMovement({
        movementType,
        inventoryItemId: itemId,
        batchId,
        quantity: Number(quantity),
        fromSection: b?.inventoryItemId ? itemsById[b.inventoryItemId]?.laboratorySection ?? null : null,
        toSection: null,
        reason,
        authorisedBy: authorisedBy.trim() || null,
        referenceNumber: null,
        notes: "",
      });
      toast.success(`${movementType} recorded by ${user.name}.`);
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record movement.");
    } finally {
      setSubmitting(false);
    }
  }

  const rows = movements.filter((m) => {
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
                      <SelectContent>{inventory.map((i) => <SelectItem key={i.id} value={i.id}>{i.itemName}</SelectItem>)}</SelectContent>
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
                            batches.filter((b) => b.inventoryItemId === itemId).map((b) => (
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
                      <Label className="text-xs">{movementType === "Adjust" ? "Corrected total quantity" : "Quantity"}</Label>
                      <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Authorised by (optional)</Label>
                      <Input value={authorisedBy} onChange={(e) => setAuthorisedBy(e.target.value)} placeholder="Officer name" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Reason</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for adjustments and discards" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recorded by: <span className="font-medium text-foreground">{getCurrentUser()?.name ?? "no user selected"}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving…" : "Save movement"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search movements..." />
        {!ready ? (
          <div className="text-sm text-muted-foreground">Loading local database…</div>
        ) : rows.length === 0 ? <EmptyState /> : (
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
