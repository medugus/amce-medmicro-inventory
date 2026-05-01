import { AMCE_EQUIPMENT, AMCE_DURABLES, AMCE_MAINTENANCE, AMCE_CALIBRATION } from "@/data/amceAssets";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Cpu, Hammer, Wrench } from "lucide-react";

export function EquipmentRegisterPage() {
  return (
    <div>
      <Header
        title="Equipment Register"
        description="Laboratory equipment is tracked separately from consumables. Serial numbers, asset numbers and calibration dates must be entered from real records."
        actions={<ExportButton />}
      />
      <div className="p-6">
        {AMCE_EQUIPMENT.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="Equipment register is empty."
            description="No equipment has been imported yet. Real equipment records will be loaded from the AMCE Equipment Register sheet. Serial numbers, asset numbers and calibration dates are not invented."
          />
        ) : null}
      </div>
    </div>
  );
}

export function DurablesRegisterPage() {
  return (
    <div>
      <Header
        title="Durables Register"
        description="Reusable laboratory assets that are not consumed per test, tracked separately from inventory."
        actions={<ExportButton />}
      />
      <div className="p-6">
        {AMCE_DURABLES.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="Durables register is empty."
            description="No durables have been imported yet. Real durable asset data will be loaded from the AMCE Durables sheet."
          />
        ) : null}
      </div>
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
            description="Records will appear once the Equipment Register is populated and service activity is logged. No fake calibration dates are pre-loaded."
          />
        ) : null}
      </div>
    </div>
  );
}
