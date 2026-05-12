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
import { Checkbox } from "@/components/ui/checkbox";
import { useInventory } from "@/lib/useLiveData";
import { createBatch, updateInventoryItem } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";
import { InlineWarning } from "@/components/common/InlineWarning";
import { ScanLine } from "lucide-react";

interface ReceiveBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInventoryItemId?: string;
  scannedCode?: string;
  onCreated?: (batchId: string, inventoryItemId: string) => void;
}

function receiptSeedFromCode(code: string) {
  const cleaned = code.normalize("NFKC").replace(/^[\]]\w\d/, "").trim();
  const lot = cleaned.match(/\(10\)([^()\u001d]+)/)?.[1]?.trim();
  const batch = cleaned.match(/\(21\)([^()\u001d]+)/)?.[1]?.trim() || lot || cleaned;
  const expiry = cleaned.match(/\(17\)(\d{6})/)?.[1];
  const expiryDate = expiry ? `20${expiry.slice(0, 2)}-${expiry.slice(2, 4)}-${expiry.slice(4, 6)}` : "";
  return {
    batchNumber: batch.length > 80 ? batch.slice(0, 80) : batch,
    lotNumber: lot ? (lot.length > 80 ? lot.slice(0, 80) : lot) : batch.length > 80 ? batch.slice(0, 80) : batch,
    expiryDate,
  };
}

export function ReceiveBatchDialog({
  open,
  onOpenChange,
  defaultInventoryItemId = "",
  scannedCode = "",
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
  const [rememberBarcode, setRememberBarcode] = useState(true);

  useEffect(() => {
    if (!open) return;
    setItemId(defaultInventoryItemId);
    setRememberBarcode(true);
    if (!scannedCode.trim()) return;
    const code = scannedCode.trim();
    const seed = receiptSeedFromCode(code);
    setBatchNumber(seed.batchNumber);
    setLotNumber(seed.lotNumber);
    if (seed.expiryDate) setExpiryDate(seed.expiryDate);
    setNotes(`Scanned barcode: ${code}`);
  }, [open, defaultInventoryItemId, scannedCode]);

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
      // If the user scanned a barcode and asked to remember it, save it on the
      // inventory item so future scans of the same code auto-match.
      if (rememberBarcode && scannedCode.trim() && selected) {
        const code = scannedCode.trim();
        const already = (selected.catalogueNumber ?? "").trim() === code;
        if (!already) {
          try {
            await updateInventoryItem(
              selected.id,
              selected.catalogueNumber
                ? { notes: `${selected.notes ?? ""}\nSupplier barcode: ${code}`.trim() }
                : { catalogueNumber: code },
              "Linked supplier barcode from scan",
            );
          } catch {
            // non-fatal
          }
        }
      }
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
          {scannedCode.trim() && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ScanLine className="h-3.5 w-3.5" /> Scanned barcode
              </div>
              <div className="font-mono break-all">{scannedCode.trim()}</div>
              {selected && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberBarcode}
                    onCheckedChange={(v) => setRememberBarcode(v === true)}
                  />
                  <span className="text-muted-foreground leading-snug">
                    Remember this barcode for <span className="font-medium text-foreground">{selected.itemName}</span> so the next scan auto-fills the product.
                  </span>
                </label>
              )}
              {!selected && (
                <div className="text-muted-foreground">
                  Pick the matching inventory item below — the barcode will be saved against it for next time.
                </div>
              )}
            </div>
          )}
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
