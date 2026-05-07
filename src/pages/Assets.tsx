import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Cpu, Hammer, Wrench } from "lucide-react";
import { useEquipment, useDurables } from "@/lib/useLiveData";
import { ensureDurablesSeeded } from "@/lib/db";
import { AMCE_MAINTENANCE, AMCE_CALIBRATION, AMCE_EQUIPMENT, AMCE_DURABLES } from "@/data/amceAssets";
import { EquipmentDialog } from "@/components/forms/EquipmentDialog";
import { DurableDialog } from "@/components/forms/DurableDialog";
import { deleteEquipment, deleteDurable } from "@/lib/actions";
import { toast } from "sonner";
import type { EquipmentAsset, DurableAsset } from "@/types";
import { EquipmentTable } from "@/components/assets/EquipmentTable";
import { DurablesTable } from "@/components/assets/DurablesTable";
import { DeleteAssetDialog } from "@/components/assets/DeleteAssetDialog";

export function EquipmentRegisterPage() {
  const equipment = useEquipment();
  const equipmentRows: EquipmentAsset[] = equipment.length ? equipment : AMCE_EQUIPMENT;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentAsset | null>(null);
  const [deleting, setDeleting] = useState<EquipmentAsset | null>(null);

  return (
    <div>
      <Header
        helpTopic="assets"
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
        {equipmentRows.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="Equipment register is empty."
            description="Use Add equipment to record real items. Serial numbers, asset numbers and calibration dates are not invented."
          />
        ) : (
          <EquipmentTable
            rows={equipmentRows}
            onEdit={(e) => { setEditing(e); setDialogOpen(true); }}
            onDelete={(e) => setDeleting(e)}
          />
        )}
      </div>

      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} asset={editing} />
      <DeleteAssetDialog
        asset={deleting}
        label={deleting?.equipmentName ?? "equipment"}
        description="This removes the equipment record on this computer."
        onClose={() => setDeleting(null)}
        onDelete={deleteEquipment}
      />
    </div>
  );
}

export function DurablesRegisterPage() {
  const durables = useDurables();
  const durableRows: DurableAsset[] = durables.length ? durables : AMCE_DURABLES;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DurableAsset | null>(null);
  const [deleting, setDeleting] = useState<DurableAsset | null>(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [attemptedAutoLoad, setAttemptedAutoLoad] = useState(false);

  async function loadBaselineDurables() {
    try {
      setLoadingBaseline(true);
      await ensureDurablesSeeded();
      window.dispatchEvent(new CustomEvent("amce:db-changed"));
      toast.success("Lab durables loaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load durables.");
    } finally {
      setLoadingBaseline(false);
    }
  }

  useEffect(() => {
    if (durables.length > 0 || attemptedAutoLoad || loadingBaseline) return;
    setAttemptedAutoLoad(true);
    void loadBaselineDurables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durables.length, attemptedAutoLoad, loadingBaseline]);

  return (
    <div>
      <Header
        helpTopic="assets"
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
          <EmptyState
            icon={Hammer}
            title="Durables register is empty."
            description="Use Add durable to record reusable lab assets, or load the lab baseline list."
            action={(
              <Button variant="secondary" onClick={loadBaselineDurables} disabled={loadingBaseline}>
                {loadingBaseline ? "Loading..." : "Load lab durables"}
              </Button>
            )}
          />
        ) : (
          <DurablesTable
            rows={durableRows}
            onEdit={(d) => { setEditing(d); setDialogOpen(true); }}
            onDelete={(d) => setDeleting(d)}
          />
        )}
      </div>

      <DurableDialog open={dialogOpen} onOpenChange={setDialogOpen} asset={editing} />
      <DeleteAssetDialog
        asset={deleting}
        label={deleting?.assetName ?? "durable"}
        description="This removes the durable record on this computer."
        onClose={() => setDeleting(null)}
        onDelete={deleteDurable}
      />
    </div>
  );
}

export function MaintenanceCalibrationPage() {
  return (
    <div>
      <Header
        helpTopic="assets"
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
