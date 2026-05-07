import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SECTION_NAME } from "@/data/amceSections";
import { updateSupplyRecord } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";
import type { SupplyStatus, ProcurementStatus, SupplyStatusRecord } from "@/types";

const SUPPLY_VALUES: SupplyStatus[] = [
  "Requested", "Pending procurement", "Under review", "Ordered",
  "Partially supplied", "Supplied", "Not supplied", "Delayed",
  "Cancelled", "Requires clarification",
];
const PROC_VALUES: ProcurementStatus[] = [
  "Not started", "Awaiting quotation", "Quotation received", "Awaiting approval",
  "Approved", "Ordered", "Delivery pending", "Delivered", "Partially delivered",
  "Delayed", "Rejected", "Closed", "Requires procurement update",
];

export function SupplyEditDialog({
  record,
  onClose,
}: {
  record: SupplyStatusRecord | null;
  onClose: () => void;
}) {
  const [eSupply, setESupply] = useState<SupplyStatus>("Requested");
  const [eProc, setEProc] = useState<ProcurementStatus>("Not started");
  const [eSupplied, setESupplied] = useState("");
  const [eOutstanding, setEOutstanding] = useState("");
  const [eSupplier, setESupplier] = useState("");
  const [eDateOrdered, setEDateOrdered] = useState("");
  const [eDateSupplied, setEDateSupplied] = useState("");
  const [eRemarks, setERemarks] = useState("");
  const [eReason, setEReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!record) return;
    setESupply(record.supplyStatus);
    setEProc(record.procurementStatus);
    setESupplied(record.suppliedQuantity?.toString() ?? "");
    setEOutstanding(record.outstandingQuantity?.toString() ?? "");
    setESupplier(record.supplier ?? "");
    setEDateOrdered(record.dateOrdered ?? "");
    setEDateSupplied(record.dateSupplied ?? "");
    setERemarks(record.remarks);
    setEReason("");
  }, [record]);

  async function save() {
    if (!record) return;
    const user = getCurrentUser();
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!eReason.trim()) { toast.error("A reason for the update is required for the audit trail."); return; }
    setSubmitting(true);
    try {
      await updateSupplyRecord({
        id: record.id,
        reason: eReason,
        patch: {
          supplyStatus: eSupply,
          procurementStatus: eProc,
          suppliedQuantity: eSupplied === "" ? null : Number(eSupplied),
          outstandingQuantity: eOutstanding === "" ? null : Number(eOutstanding),
          supplier: eSupplier.trim() || null,
          dateOrdered: eDateOrdered || null,
          dateSupplied: eDateSupplied || null,
          remarks: eRemarks,
        },
      });
      toast.success(`Supply record updated by ${user.name}.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={!!record} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Update supply record</DialogTitle></DialogHeader>
        {record && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">{record.itemName}</div>
              <div className="text-xs text-muted-foreground">{record.category} — {SECTION_NAME[record.laboratorySection]}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Supply status</Label>
                <Select value={eSupply} onValueChange={(v) => setESupply(v as SupplyStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPLY_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Procurement status</Label>
                <Select value={eProc} onValueChange={(v) => setEProc(v as ProcurementStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROC_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Supplied quantity</Label>
                <Input type="number" min={0} value={eSupplied} onChange={(e) => setESupplied(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Outstanding quantity</Label>
                <Input type="number" min={0} value={eOutstanding} onChange={(e) => setEOutstanding(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Supplier</Label>
              <Input value={eSupplier} onChange={(e) => setESupplier(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date ordered</Label>
                <Input type="date" value={eDateOrdered} onChange={(e) => setEDateOrdered(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Date supplied</Label>
                <Input type="date" value={eDateSupplied} onChange={(e) => setEDateSupplied(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea value={eRemarks} onChange={(e) => setERemarks(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Reason for update (required for audit trail)</Label>
              <Textarea value={eReason} onChange={(e) => setEReason(e.target.value)} placeholder="e.g. Confirmed delivery from Bio-Rad on 2026-05-01" />
            </div>
            <div className="text-xs text-muted-foreground">
              Recorded by: <span className="font-medium text-foreground">{getCurrentUser()?.name ?? "no user selected"}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={save} disabled={submitting}>{submitting ? "Saving…" : "Save update"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
