import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { EquipmentAsset, EquipmentOperationalStatus, LaboratorySectionId } from "@/types";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { EQUIPMENT_CATEGORIES } from "@/data/categories";
import { createEquipment, updateEquipment, type EquipmentInput } from "@/lib/actions";
import { useCurrentUser } from "@/lib/currentUser";

const STATUSES: EquipmentOperationalStatus[] = [
  "Operational", "Under maintenance", "Out of service", "Awaiting repair",
  "Decommissioned", "Pending installation", "Not documented",
];

const EMPTY: EquipmentInput = {
  equipmentName: "",
  equipmentCategory: EQUIPMENT_CATEGORIES[0],
  manufacturer: null,
  model: null,
  serialNumber: null,
  assetNumber: null,
  laboratorySection: "stores",
  location: null,
  responsibleOfficer: null,
  installationDate: null,
  warrantyStatus: "Not documented",
  serviceContractStatus: "Not documented",
  operationalStatus: "Operational",
  calibrationRequired: false,
  calibrationFrequency: null,
  lastCalibrationDate: null,
  nextCalibrationDueDate: null,
  maintenanceRequired: false,
  lastMaintenanceDate: null,
  nextMaintenanceDueDate: null,
  notes: "",
};

export function EquipmentDialog({
  open, onOpenChange, asset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  asset?: EquipmentAsset | null;
}) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState<EquipmentInput>(EMPTY);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (asset) { const { id: _id, ...rest } = asset; setForm(rest); }
      else setForm(EMPTY);
      setReason("");
    }
  }, [open, asset]);

  function set<K extends keyof EquipmentInput>(k: K, v: EquipmentInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!form.equipmentName.trim()) { toast.error("Equipment name is required."); return; }
    setBusy(true);
    try {
      if (asset) { await updateEquipment(asset.id, form, reason); toast.success("Equipment updated."); }
      else { await createEquipment(form); toast.success("Equipment added."); }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit equipment" : "Add equipment"}</DialogTitle>
          <DialogDescription>Real serial / asset numbers and calibration dates only — leave blank if not known.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label>Equipment name *</Label>
            <Input value={form.equipmentName} onChange={(e) => set("equipmentName", e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.equipmentCategory} onValueChange={(v) => set("equipmentCategory", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EQUIPMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Section</Label>
            <Select value={form.laboratorySection} onValueChange={(v) => set("laboratorySection", v as LaboratorySectionId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Manufacturer</Label><Input value={form.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value || null)} /></div>
          <div><Label>Model</Label><Input value={form.model ?? ""} onChange={(e) => set("model", e.target.value || null)} /></div>
          <div><Label>Serial number</Label><Input value={form.serialNumber ?? ""} onChange={(e) => set("serialNumber", e.target.value || null)} /></div>
          <div><Label>Asset number</Label><Input value={form.assetNumber ?? ""} onChange={(e) => set("assetNumber", e.target.value || null)} /></div>
          <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value || null)} /></div>
          <div><Label>Responsible officer</Label><Input value={form.responsibleOfficer ?? ""} onChange={(e) => set("responsibleOfficer", e.target.value || null)} /></div>
          <div>
            <Label>Operational status</Label>
            <Select value={form.operationalStatus} onValueChange={(v) => set("operationalStatus", v as EquipmentOperationalStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Installation date</Label><Input type="date" value={form.installationDate ?? ""} onChange={(e) => set("installationDate", e.target.value || null)} /></div>
          <div><Label>Warranty status</Label><Input value={form.warrantyStatus} onChange={(e) => set("warrantyStatus", e.target.value)} /></div>
          <div><Label>Service contract</Label><Input value={form.serviceContractStatus} onChange={(e) => set("serviceContractStatus", e.target.value)} /></div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={form.calibrationRequired} onCheckedChange={(v) => set("calibrationRequired", v)} />
            <Label>Calibration required</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={form.maintenanceRequired} onCheckedChange={(v) => set("maintenanceRequired", v)} />
            <Label>Maintenance required</Label>
          </div>
          <div><Label>Calibration frequency</Label><Input value={form.calibrationFrequency ?? ""} onChange={(e) => set("calibrationFrequency", e.target.value || null)} placeholder="e.g. Annual" /></div>
          <div></div>
          <div><Label>Last calibration</Label><Input type="date" value={form.lastCalibrationDate ?? ""} onChange={(e) => set("lastCalibrationDate", e.target.value || null)} /></div>
          <div><Label>Next calibration due</Label><Input type="date" value={form.nextCalibrationDueDate ?? ""} onChange={(e) => set("nextCalibrationDueDate", e.target.value || null)} /></div>
          <div><Label>Last maintenance</Label><Input type="date" value={form.lastMaintenanceDate ?? ""} onChange={(e) => set("lastMaintenanceDate", e.target.value || null)} /></div>
          <div><Label>Next maintenance due</Label><Input type="date" value={form.nextMaintenanceDueDate ?? ""} onChange={(e) => set("nextMaintenanceDueDate", e.target.value || null)} /></div>
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
          <Button onClick={submit} disabled={busy}>{asset ? "Save changes" : "Add equipment"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
