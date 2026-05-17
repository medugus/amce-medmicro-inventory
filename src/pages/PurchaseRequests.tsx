import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { usePurchaseRequests } from "@/lib/useLiveData";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import { PurchaseRequestDialog } from "@/components/forms/PurchaseRequestDialog";
import { deletePurchaseRequest } from "@/lib/actions";
import { toast } from "sonner";
import type { PurchaseRequest } from "@/types";

export function PurchaseRequestsPage() {
  const rows = usePurchaseRequests();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(r: PurchaseRequest) { setEditing(r); setOpen(true); }

  async function onDelete(r: PurchaseRequest) {
    const reason = window.prompt(`Delete purchase request for "${r.itemName}"?\nReason (required for audit trail):`);
    if (reason === null) return;
    if (!reason.trim()) { toast.error("A reason is required."); return; }
    try {
      await deletePurchaseRequest(r.id, reason.trim());
      toast.success("Purchase request deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  return (
    <div>
      <Header
        helpTopic="purchaseRequests"
        title="Purchase Requests"
        description="Section-initiated procurement requests with workflow status, approval and procurement tracking."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Add request</Button>
            <ExportButton />
          </div>
        }
      />
      <div className="p-6 space-y-4">
        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Requested by</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Preferred mfr.</th>
                  <th className="p-2">Alternate mfr.</th>
                  <th className="p-2 text-right">Qty/unit</th>
                  <th className="p-2 text-right">Units required</th>
                  <th className="p-2 text-right">Current</th>
                  <th className="p-2 text-right">Avg/mo</th>
                  <th className="p-2">Urgency</th>
                  <th className="p-2">Approval</th>
                  <th className="p-2">Justification</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 text-xs">{r.requestDate}</td>
                    <td className="p-2 text-xs">{SECTION_NAME[r.requestingSection]}</td>
                    <td className="p-2 text-xs">{r.requestedBy}</td>
                    <td className="p-2 font-medium">{r.itemName}</td>
                    <td className="p-2 text-xs">{r.preferredManufacturer || NOT_DOCUMENTED}</td>
                    <td className="p-2 text-xs">{r.alternateManufacturer || NOT_DOCUMENTED}</td>
                    <td className="p-2 text-right tabular-nums">{r.quantityPerUnit}</td>
                    <td className="p-2 text-right tabular-nums">{r.unitsRequired}</td>
                    <td className="p-2 text-right tabular-nums">{r.currentStock}</td>
                    <td className="p-2 text-right tabular-nums">{r.averageMonthlyUsage}</td>
                    <td className="p-2"><StatusBadge label={r.urgency} tone={toneForCriticality(r.urgency)} /></td>
                    <td className="p-2"><StatusBadge label={r.approvalStatus} tone={r.approvalStatus === "Approved" ? "success" : r.approvalStatus === "Rejected" ? "destructive" : "info"} /></td>
                    <td className="p-2 text-xs">{r.justification || NOT_DOCUMENTED}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(r)} aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PurchaseRequestDialog open={open} onOpenChange={setOpen} request={editing} />
    </div>
  );
}
