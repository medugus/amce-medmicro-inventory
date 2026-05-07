import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { SECTION_NAME } from "@/data/amceSections";
import type { DurableAsset } from "@/types";

export function DurablesTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: DurableAsset[];
  onEdit: (d: DurableAsset) => void;
  onDelete: (d: DurableAsset) => void;
}) {
  return (
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
          {rows.map((d) => (
            <tr key={d.id} className="border-t border-border hover:bg-muted/30">
              <td className="p-2 font-medium">{d.assetName}</td>
              <td className="p-2 text-xs">{d.assetCategory}</td>
              <td className="p-2 text-xs">{SECTION_NAME[d.laboratorySection]}</td>
              <td className="p-2 text-xs">{d.location ?? "—"}</td>
              <td className="p-2 text-right tabular-nums">{d.quantity ?? "—"}</td>
              <td className="p-2 text-xs">{d.condition}</td>
              <td className="p-2 text-xs">{d.responsibleOfficer ?? "—"}</td>
              <td className="p-2 text-right whitespace-nowrap">
                <Button size="icon" variant="ghost" onClick={() => onEdit(d)} aria-label={`Edit ${d.assetName}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(d)} aria-label={`Delete ${d.assetName}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
