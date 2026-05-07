import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { SECTION_NAME } from "@/data/amceSections";
import type { EquipmentAsset } from "@/types";

export function EquipmentTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: EquipmentAsset[];
  onEdit: (e: EquipmentAsset) => void;
  onDelete: (e: EquipmentAsset) => void;
}) {
  return (
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
          {rows.map((e) => (
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
                <Button size="icon" variant="ghost" onClick={() => onEdit(e)} aria-label={`Edit ${e.equipmentName}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(e)} aria-label={`Delete ${e.equipmentName}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
