// Inline "Receive new batch" dialog used from the Stock Movements page so
// users do not have to leave the page to register a fresh delivery.

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItemPicker } from "@/components/forms/InventoryItemPicker";
import { useInventory } from "@/lib/useLiveData";
import { createBatch } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";
import { InlineWarning } from "@/components/common/InlineWarning";

interface ReceiveBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInventoryItemId?: string;
  onCreated?: (batchId: string, inventoryItemId: string) => void;
}

export function ReceiveBatchDialog({
  open,
  onOpenChange,
  defaultInventoryItemId = "",
  onCreated,
}: ReceiveBatchDialogProps) {
  const inventory = useInventory();
  const today = new Date().toISOString().slice(0, 10);

  const [itemId, setItemId] = useState(defaultInventoryItemId);
  const [batchNumber, setBatchNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dateReceived, setDateReceived] = useState(today);
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setItemId(defaultInventoryItemId);
  }, [open, defaultInventoryItemId]);

  const selected = inventory.find((i) => i.id === itemId);

  function reset() {
    setBatchNumber("");
    setLotNumber("");
    setQuantity("");
    setExpiryDate("");
    setDateReceived(today);
    setStorageLocation("");
    setNotes("");
  }

  async function handleSave() {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Select a user in the top bar before receiving a batch.");
      return;
    }
    setSubmitting(true);
    try {
      const batch = await createBatch({
        inventoryItemId: itemId,
        batchNumber,
        lotNumber: lotNumber || null,
        quantityReceived: Number(quantity),
        expiryDate: expiryDate || null,
        dateReceived,
        storageLocation,
        storageConditionRequired: selected?.storageCondition ?? "",
        notes,
      });
      toast.success(
        `Batch ${batch.batchNumber} received — now go to Acceptance Testing to release it.`
      );
      onCreated?.(batch.id, batch.inventoryItemId);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive batch.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive new batch</DialogTitle>
          <DialogDescription>
            Records the delivery and creates the batch as <em>Pending acceptance</em>.
            Run Acceptance Testing afterwards to release it for issue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Inventory item</Label>
            <InventoryItemPicker
              items={inventory}
              value={itemId}
              onChange={setItemId}
              groupBy="category"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Batch number</Label>
              <Input
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. CHA-2026-04"
              />
            </div>
            <div>
              <Label className="text-xs">Lot number (optional)</Label>
              <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Quantity received</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Date received</Label>
              <Input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Expiry date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          {!expiryDate && (
            <InlineWarning>
              No expiry date entered. This batch will not appear in FEFO or expiry alerts. Only leave blank if the product genuinely has no expiry.
            </InlineWarning>
          )}
          <div>
            <Label className="text-xs">Storage location</Label>
            <Input
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder={selected?.storageCondition || "e.g. Cold-room shelf 3"}
            />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">
            Recorded by:{" "}
            <span className="font-medium text-foreground">
              {getCurrentUser()?.name ?? "no user selected"}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving…" : "Receive batch"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
