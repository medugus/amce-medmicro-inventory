import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForBatchStatus } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { releaseFromQuarantine, discardBatch, quarantineBatch } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";
import type { InventoryBatch } from "@/types";

type ActionKind = "release" | "discard" | "quarantine";

export function QuarantinedStockPage() {
  const inventory = useInventory();
  const batches = useBatches();
  const itemsById = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const rows = batches.filter((b) => b.batchStatus === "Quarantined" || b.batchStatus === "Rejected");

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<InventoryBatch | null>(null);
  const [kind, setKind] = useState<ActionKind>("release");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function start(batch: InventoryBatch, k: ActionKind) {
    setTarget(batch); setKind(k); setReason(""); setOpen(true);
  }

  async function save() {
    if (!target) return;
    const user = getCurrentUser();
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (kind !== "release" && !reason.trim()) { toast.error("A reason is required."); return; }
    setSubmitting(true);
    try {
      if (kind === "release") await releaseFromQuarantine(target.id, reason);
      else if (kind === "discard") await discardBatch(target.id, reason);
      else await quarantineBatch(target.id, reason);
      toast.success(`Batch ${kind === "release" ? "released" : kind === "discard" ? "discarded" : "quarantined"} by ${user.name}.`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally { setSubmitting(false); }
  }

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
                  <th className="p-2">Actions</th>
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
                      <td className="p-2 text-xs print:hidden">
                        <div className="flex gap-1">
                          {b.batchStatus === "Quarantined" && (
                            <Button size="sm" variant="outline" onClick={() => start(b, "release")}>Release</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => start(b, "discard")}>Discard</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {kind === "release" ? "Release from quarantine" : kind === "discard" ? "Discard batch" : "Quarantine batch"}
            </DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{itemsById[target.inventoryItemId]?.itemName ?? target.inventoryItemId}</div>
                <div className="text-xs text-muted-foreground">Batch {target.batchNumber} — qty {target.quantityAvailable}</div>
              </div>
              <div>
                <Label className="text-xs">{kind === "release" ? "Notes (optional)" : "Reason (required)"}</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="text-xs text-muted-foreground">
                Recorded by: <span className="font-medium text-foreground">{getCurrentUser()?.name ?? "no user selected"}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={submitting}>{submitting ? "Saving…" : "Confirm"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
