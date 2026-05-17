import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type {
  PurchaseRequest,
  Criticality,
  LaboratorySectionId,
  PurchaseRequestStatus,
  ProcurementStatus,
} from "@/types";
import { AMCE_SECTIONS } from "@/data/amceSections";
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  type PurchaseRequestInput,
} from "@/lib/actions";
import { useCurrentUser } from "@/lib/currentUser";
import { todayISODate } from "@/lib/dates";

const CRITS: Criticality[] = ["Critical", "High", "Medium", "Low"];
const APPROVAL: PurchaseRequestStatus[] = [
  "Draft", "Submitted", "Under review", "Approved", "Rejected",
  "Ordered", "Partially supplied", "Supplied", "Closed",
];
const PROCUREMENT: ProcurementStatus[] = [
  "Not started", "Awaiting quotation", "Quotation received", "Awaiting approval",
  "Approved", "Ordered", "Delivery pending", "Delivered", "Partially delivered",
  "Delayed", "Rejected", "Closed", "Requires procurement update",
];

function emptyInput(defaultUser: string | null): PurchaseRequestInput {
  return {
    requestDate: todayISODate(),
    requestingSection: "stores",
    requestedBy: defaultUser ?? "",
    itemName: "",
    quantityRequested: 0,
    quantityPerUnit: 1,
    unitsRequired: 0,
    justification: "",
    urgency: "Medium",
    currentStock: 0,
    averageMonthlyUsage: 0,
    preferredManufacturer: null,
    alternateManufacturer: null,
    approvalStatus: "Draft",
    approvedBy: null,
    procurementStatus: "Not started",
    dateSupplied: null,
  };
}

export function PurchaseRequestDialog({
  open, onOpenChange, request,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  request?: PurchaseRequest | null;
}) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState<PurchaseRequestInput>(() => emptyInput(user?.name ?? null));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (request) {
        const { id: _id, ...rest } = request;
        setForm(rest);
      } else {
        setForm(emptyInput(user?.name ?? null));
      }
      setReason("");
    }
  }, [open, request, user]);

  function set<K extends keyof PurchaseRequestInput>(k: K, v: PurchaseRequestInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!form.itemName.trim()) { toast.error("Item name is required."); return; }
    setBusy(true);
    const normalizedForm: PurchaseRequestInput = {
      ...form,
      quantityRequested: form.quantityPerUnit * form.unitsRequired,
    };
    try {
      if (request) {
        await updatePurchaseRequest(request.id, normalizedForm, reason);
        toast.success("Purchase request updated.");
      } else {
        await createPurchaseRequest(normalizedForm);
        toast.success("Purchase request added.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request ? "Edit purchase request" : "Add purchase request"}</DialogTitle>
          <DialogDescription>
            Capture an item the section needs procurement to source.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label>Item name *</Label>
            <Input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} />
          </div>
          <div>
            <Label>Request date</Label>
            <Input type="date" value={form.requestDate} onChange={(e) => set("requestDate", e.target.value)} />
          </div>
          <div>
            <Label>Requesting section</Label>
            <Select value={form.requestingSection} onValueChange={(v) => set("requestingSection", v as LaboratorySectionId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Requested by</Label>
            <Input value={form.requestedBy} onChange={(e) => set("requestedBy", e.target.value)} />
          </div>
          <div>
            <Label>Urgency</Label>
            <Select value={form.urgency} onValueChange={(v) => set("urgency", v as Criticality)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRITS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity per unit</Label>
            <Input type="number" value={form.quantityPerUnit}
              onChange={(e) => set("quantityPerUnit", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Units required</Label>
            <Input type="number" value={form.unitsRequired}
              onChange={(e) => set("unitsRequired", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Current stock</Label>
            <Input type="number" value={form.currentStock}
              onChange={(e) => set("currentStock", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Average monthly usage</Label>
            <Input type="number" value={form.averageMonthlyUsage}
              onChange={(e) => set("averageMonthlyUsage", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Preferred manufacturer</Label>
            <Input value={form.preferredManufacturer ?? ""}
              onChange={(e) => set("preferredManufacturer", e.target.value || null)} />
          </div>
          <div>
            <Label>Alternate manufacturer</Label>
            <Input value={form.alternateManufacturer ?? ""}
              onChange={(e) => set("alternateManufacturer", e.target.value || null)} />
          </div>
          <div>
            <Label>Approval status</Label>
            <Select value={form.approvalStatus} onValueChange={(v) => set("approvalStatus", v as PurchaseRequestStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {APPROVAL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Procurement status</Label>
            <Select value={form.procurementStatus} onValueChange={(v) => set("procurementStatus", v as ProcurementStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROCUREMENT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Justification</Label>
            <Textarea value={form.justification} onChange={(e) => set("justification", e.target.value)} rows={2} />
          </div>
          {request && (
            <div className="col-span-2">
              <Label>Reason for change (audit trail)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. urgency upgraded" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{request ? "Save changes" : "Add request"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
