import { Button } from "@/components/ui/button";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import {
  StatusBadge,
  toneForCriticality,
  toneForProcurementStatus,
  toneForSupplyStatus,
} from "@/components/common/StatusBadge";
import { actionRequired, supplyStatusFlags } from "@/logic/supplyStatus";
import type { SupplyStatusRecord } from "@/types";

export function SupplyTable({
  rows,
  onEdit,
  onPromote,
}: {
  rows: SupplyStatusRecord[];
  onEdit: (r: SupplyStatusRecord) => void;
  onPromote?: (r: SupplyStatusRecord) => void;
}) {
  return (
    <div className="border border-border rounded-md overflow-x-auto bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-2">Item</th>
            <th className="p-2">Section</th>
            <th className="p-2">Responsible</th>
            <th className="p-2 text-right">Requested</th>
            <th className="p-2 text-right">Supplied</th>
            <th className="p-2 text-right">Outstanding</th>
            <th className="p-2">Supplier</th>
            <th className="p-2">Procurement</th>
            <th className="p-2">Crit.</th>
            <th className="p-2">Remarks</th>
            <th className="p-2">Action required</th>
            <th className="p-2 print:hidden"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const flags = supplyStatusFlags(r);
            return (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30 align-top">
                <td className="p-2">
                  <div className="font-medium">{r.itemName}</div>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                  <div className="mt-1"><StatusBadge label={r.supplyStatus} tone={toneForSupplyStatus(r.supplyStatus)} /></div>
                </td>
                <td className="p-2 text-xs">{SECTION_NAME[r.laboratorySection]}</td>
                <td className="p-2 text-xs">{r.responsiblePerson}</td>
                <td className="p-2 text-right tabular-nums">{r.requestedQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                <td className="p-2 text-right tabular-nums">{r.suppliedQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                <td className="p-2 text-right tabular-nums">{r.outstandingQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                <td className="p-2 text-xs">{r.supplier ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                <td className="p-2"><StatusBadge label={r.procurementStatus} tone={toneForProcurementStatus(r.procurementStatus)} /></td>
                <td className="p-2"><StatusBadge label={r.criticality} tone={toneForCriticality(r.criticality)} /></td>
                <td className="p-2 text-xs max-w-xs">
                  <div>{r.remarks}</div>
                  {flags.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {flags.map((f, i) => <StatusBadge key={i} label={f.message} tone="warning" />)}
                    </div>
                  )}
                </td>
                <td className="p-2 text-xs">{actionRequired(r)}</td>
                <td className="p-2 print:hidden">
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit(r)}>Update</Button>
                    {onPromote && (
                      <Button size="sm" variant="secondary" onClick={() => onPromote(r)}>Receive</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
