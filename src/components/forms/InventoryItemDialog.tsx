import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { InventoryItem, Criticality, LaboratorySectionId } from "@/types";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { INVENTORY_CATEGORIES } from "@/data/categories";
import { createInventoryItem, updateInventoryItem, type InventoryItemInput } from "@/lib/actions";
import { useCurrentUser } from "@/lib/currentUser";

const CRITS: Criticality[] = ["Critical", "High", "Medium", "Low"];

const EMPTY: InventoryItemInput = {
  itemName: "",
  category: INVENTORY_CATEGORIES[0],
  laboratorySection: "stores",
  unitOfIssue: "each",
  manufacturer: null,
  supplier: null,
  catalogueNumber: null,
  reorderLevel: 0,
  minimumStock: 0,
  maximumStock: 0,
  storageCondition: "Room temperature",
  criticality: "Medium",
  active: true,
  notes: "",
};

export function InventoryItemDialog({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item?: InventoryItem | null;
}) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState<InventoryItemInput>(EMPTY);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        const { id: _id, ...rest } = item;
        setForm(rest);
      } else {
        setForm(EMPTY);
      }
      setReason("");
    }
  }, [open, item]);

  function set<K extends keyof InventoryItemInput>(k: K, v: InventoryItemInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!form.itemName.trim()) { toast.error("Item name is required."); return; }
    setBusy(true);
    try {
      if (item) {
        await updateInventoryItem(item.id, form, reason);
        toast.success("Inventory item updated.");
      } else {
        await createInventoryItem(form);
        toast.success("Inventory item created.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit inventory item" : "Add inventory item"}</DialogTitle>
          <DialogDescription>
            Catalogue entry. Stock quantities are tracked at the batch level.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label>Item name *</Label>
            <Input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Section</Label>
            <Select value={form.laboratorySection} onValueChange={(v) => set("laboratorySection", v as LaboratorySectionId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unit of issue</Label>
            <Input value={form.unitOfIssue} onChange={(e) => set("unitOfIssue", e.target.value)} />
          </div>
          <div>
            <Label>Criticality</Label>
            <Select value={form.criticality} onValueChange={(v) => set("criticality", v as Criticality)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRITS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Manufacturer</Label>
            <Input value={form.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value || null)} />
          </div>
          <div>
            <Label>Supplier</Label>
            <Input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value || null)} />
          </div>
          <div>
            <Label>Catalogue number</Label>
            <Input value={form.catalogueNumber ?? ""} onChange={(e) => set("catalogueNumber", e.target.value || null)} />
          </div>
          <div>
            <Label>Storage condition</Label>
            <Input value={form.storageCondition} onChange={(e) => set("storageCondition", e.target.value)} />
          </div>
          <div>
            <Label>Reorder level</Label>
            <Input type="number" value={form.reorderLevel} onChange={(e) => set("reorderLevel", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Minimum stock</Label>
            <Input type="number" value={form.minimumStock} onChange={(e) => set("minimumStock", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Maximum stock</Label>
            <Input type="number" value={form.maximumStock} onChange={(e) => set("maximumStock", Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
            <Label>Active</Label>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          {item && (
            <div className="col-span-2">
              <Label>Reason for change (audit trail)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. corrected reorder level" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{item ? "Save changes" : "Create item"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
