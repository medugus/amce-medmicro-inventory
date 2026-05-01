import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Cpu, Hammer, Wrench } from "lucide-react";
import { useEquipment, useDurables } from "@/lib/useLiveData";
import { AMCE_MAINTENANCE, AMCE_CALIBRATION } from "@/data/amceAssets";
import { SECTION_NAME } from "@/data/amceSections";
import { EquipmentDialog } from "@/components/forms/EquipmentDialog";
import { DurableDialog } from "@/components/forms/DurableDialog";
import { deleteEquipment, deleteDurable } from "@/lib/actions";
import { toast } from "sonner";
import type { EquipmentAsset, DurableAsset } from "@/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EquipmentRegisterPage() {
  const equipment = useEquipment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentAsset | null>(null);
  const [deleting, setDeleting] = useState<EquipmentAsset | null>(null);
  const [reason, setReason] = useState("");

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteEquipment(deleting.id, reason);
      toast.success("Equipment deleted.");
      setDeleting(null); setReason("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
  }

  return (
    <div>
      <Header
        title="Equipment Register"
        description="Laboratory equipment is tracked separately from consumables. Serial numbers, asset numbers and calibration dates must be entered from real records."
        actions={
          <>
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add equipment
            </Button>
            <ExportButton />
          </>
        }
      />
      <div className="p-6">
        {equipment.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="Equipment register is empty."
            description="Use Add equipment to record real items. Serial numbers, asset numbers and calibration dates are not invented."
          />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Section</th>
                  <th className="p-2">Manufacturer</th><th className="p-2">Model</th><th className="p-2">Serial</th>
                  <th className="p-2">Status</th><th className="p-2">Next calibration</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{e.equipmentName}</td>
                    <td className="p-2 text-xs">{e.equipmentCategory}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[e.laboratorySection]}</td>
                    <td className="p-2 text-xs">{e.manufacturer ?? "—"}</td>
                    <td className="p-2 text-xs">{e.model ?? "—"}</td>
                    <td className="p-2 text-xs">{e.serialNumber ?? "—"}</td>
                    <td className="p-2 text-xs">{e.operationalStatus}</td>
                    <td className="p-2 text-xs">{e.nextCalibrationDueDate ?? "—"}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setDeleting(e); setReason(""); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} asset={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.equipmentName}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the equipment record on this computer.</AlertDialogDescription>
          </AlertDialogHeader>
          <div><Label>Reason (audit trail)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function DurablesRegisterPage() {
  const durables = useDurables();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DurableAsset | null>(null);
  const [deleting, setDeleting] = useState<DurableAsset | null>(null);
  const [reason, setReason] = useState("");

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteDurable(deleting.id, reason);
      toast.success("Durable deleted.");
      setDeleting(null); setReason("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
  }

  return (
    <div>
      <Header
        title="Durables Register"
        description="Reusable laboratory assets that are not consumed per test, tracked separately from inventory."
        actions={
          <>
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add durable
            </Button>
            <ExportButton />
          </>
        }
      />
      <div className="p-6">
        {durables.length === 0 ? (
          <EmptyState icon={Hammer} title="Durables register is empty." description="Use Add durable to record reusable lab assets." />
        ) : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Section</th>
                  <th className="p-2">Location</th><th className="p-2 text-right">Qty</th>
                  <th className="p-2">Condition</th><th className="p-2">Officer</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {durables.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{d.assetName}</td>
                    <td className="p-2 text-xs">{d.assetCategory}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[d.laboratorySection]}</td>
                    <td className="p-2 text-xs">{d.location ?? "—"}</td>
                    <td className="p-2 text-right tabular-nums">{d.quantity ?? "—"}</td>
                    <td className="p-2 text-xs">{d.condition}</td>
                    <td className="p-2 text-xs">{d.responsibleOfficer ?? "—"}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setDeleting(d); setReason(""); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DurableDialog open={dialogOpen} onOpenChange={setDialogOpen} asset={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.assetName}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the durable record on this computer.</AlertDialogDescription>
          </AlertDialogHeader>
          <div><Label>Reason (audit trail)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function MaintenanceCalibrationPage() {
  return (
    <div>
      <Header
        title="Maintenance and Calibration"
        description="Equipment maintenance, calibration, verification, downtime, service history and next due dates."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        {AMCE_MAINTENANCE.length === 0 && AMCE_CALIBRATION.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance or calibration records."
            description="Records will appear once the Equipment Register is populated and service activity is logged."
          />
        ) : null}
      </div>
    </div>
  );
}
