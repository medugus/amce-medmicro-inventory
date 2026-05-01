import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { DurableAsset, LaboratorySectionId } from "@/types";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { DURABLE_CATEGORIES } from "@/data/categories";
import { createDurable, updateDurable, type DurableInput } from "@/lib/actions";
import { useCurrentUser } from "@/lib/currentUser";

const CONDITIONS: DurableAsset["condition"][] = ["Good", "Fair", "Poor", "Not documented"];

const EMPTY: DurableInput = {
  assetName: "",
  assetCategory: DURABLE_CATEGORIES[0],
  laboratorySection: "stores",
  location: null,
  quantity: null,
  condition: "Good",
  responsibleOfficer: null,
  purchaseDate: null,
  expectedReplacementDate: null,
  notes: "",
};

export function DurableDialog({
  open, onOpenChange, asset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  asset?: DurableAsset | null;
}) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState<DurableInput>(EMPTY);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (asset) { const { id: _id, ...rest } = asset; setForm(rest); }
      else setForm(EMPTY);
      setReason("");
    }
  }, [open, asset]);

  function set<K extends keyof DurableInput>(k: K, v: DurableInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!form.assetName.trim()) { toast.error("Asset name is required."); return; }
    setBusy(true);
    try {
      if (asset) { await updateDurable(asset.id, form, reason); toast.success("Durable updated."); }
      else { await createDurable(form); toast.success("Durable added."); }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit durable" : "Add durable"}</DialogTitle>
          <DialogDescription>Reusable laboratory assets that are not consumed per test.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2"><Label>Asset name *</Label><Input value={form.assetName} onChange={(e) => set("assetName", e.target.value)} /></div>
          <div>
            <Label>Category</Label>
            <Select value={form.assetCategory} onValueChange={(v) => set("assetCategory", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DURABLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Section</Label>
            <Select value={form.laboratorySection} onValueChange={(v) => set("laboratorySection", v as LaboratorySectionId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value || null)} /></div>
          <div><Label>Responsible officer</Label><Input value={form.responsibleOfficer ?? ""} onChange={(e) => set("responsibleOfficer", e.target.value || null)} /></div>
          <div><Label>Quantity</Label><Input type="number" value={form.quantity ?? ""} onChange={(e) => set("quantity", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div>
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => set("condition", v as DurableAsset["condition"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Purchase date</Label><Input type="date" value={form.purchaseDate ?? ""} onChange={(e) => set("purchaseDate", e.target.value || null)} /></div>
          <div><Label>Expected replacement</Label><Input type="date" value={form.expectedReplacementDate ?? ""} onChange={(e) => set("expectedReplacementDate", e.target.value || null)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></div>
          {asset && (
            <div className="col-span-2">
              <Label>Reason for change (audit trail)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{asset ? "Save changes" : "Add durable"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
