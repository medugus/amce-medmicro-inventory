import { useMemo, useState } from "react";
import { usePurchaseRequests } from "@/lib/useLiveData";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality, toneForProcurementStatus } from "@/components/common/StatusBadge";
import { SECTION_NAME, AMCE_SECTIONS } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import type { Criticality, PurchaseRequest, PurchaseRequestStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPurchaseRequest, deletePurchaseRequest, updatePurchaseRequest } from "@/lib/actions";
import { toast } from "sonner";

const URGENCY: Criticality[] = ["Critical", "High", "Medium", "Low"];
const APPROVAL: PurchaseRequestStatus[] = ["Draft", "Submitted", "Under review", "Approved", "Rejected", "Ordered", "Partially supplied", "Supplied", "Closed"];

type FormState = {
  requestDate: string;
  requestingSection: PurchaseRequest["requestingSection"];
  itemName: string;
  quantityRequested: string;
  urgency: Criticality;
  justification: string;
  currentStock: string;
  averageMonthlyUsage: string;
  supplierPreference: string;
  estimatedCost: string;
  approvalStatus: PurchaseRequestStatus;
  procurementStatus: PurchaseRequest["procurementStatus"];
  dateSupplied: string;
};

const EMPTY_FORM: FormState = {
  requestDate: new Date().toISOString().slice(0, 10),
  requestingSection: "stores",
  itemName: "",
  quantityRequested: "",
  urgency: "Medium",
  justification: "",
  currentStock: "0",
  averageMonthlyUsage: "0",
  supplierPreference: "",
  estimatedCost: "",
  approvalStatus: "Submitted",
  procurementStatus: "Awaiting approval",
  dateSupplied: "",
};

export function PurchaseRequestsPage() {
  const rows = usePurchaseRequests();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const sorted = useMemo(() => [...rows].sort((a, b) => (b.requestDate ?? "").localeCompare(a.requestDate ?? "")), [rows]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, approvalStatus: "Submitted" });
    setOpen(true);
  }

  function openEdit(r: PurchaseRequest) {
    setEditing(r);
    setForm({
      requestDate: r.requestDate,
      requestingSection: r.requestingSection,
      itemName: r.itemName,
      quantityRequested: String(r.quantityRequested),
      urgency: r.urgency,
      justification: r.justification,
      currentStock: String(r.currentStock),
      averageMonthlyUsage: String(r.averageMonthlyUsage),
      supplierPreference: r.supplierPreference ?? "",
      estimatedCost: r.estimatedCost == null ? "" : String(r.estimatedCost),
      approvalStatus: r.approvalStatus,
      procurementStatus: r.procurementStatus,
      dateSupplied: r.dateSupplied ?? "",
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.itemName.trim()) return toast.error("Item/description is required.");
    if (!form.quantityRequested || Number(form.quantityRequested) <= 0) return toast.error("Quantity must be greater than zero.");
    if (!form.requestDate) return toast.error("Request date is required.");

    try {
      if (editing) {
        await updatePurchaseRequest(editing.id, {
          requestDate: form.requestDate,
          requestingSection: form.requestingSection,
          itemName: form.itemName.trim(),
          quantityRequested: Number(form.quantityRequested),
          urgency: form.urgency,
          justification: form.justification.trim(),
          currentStock: Number(form.currentStock) || 0,
          averageMonthlyUsage: Number(form.averageMonthlyUsage) || 0,
          supplierPreference: form.supplierPreference.trim() || null,
          estimatedCost: form.estimatedCost.trim() === "" ? null : Number(form.estimatedCost),
          approvalStatus: form.approvalStatus,
          procurementStatus: form.procurementStatus,
          dateSupplied: form.dateSupplied || null,
        });
        toast.success("Purchase request updated.");
      } else {
        await createPurchaseRequest({
          requestDate: form.requestDate,
          requestingSection: form.requestingSection,
          itemName: form.itemName.trim(),
          quantityRequested: Number(form.quantityRequested),
          urgency: form.urgency,
          justification: form.justification.trim(),
          currentStock: Number(form.currentStock) || 0,
          averageMonthlyUsage: Number(form.averageMonthlyUsage) || 0,
          supplierPreference: form.supplierPreference.trim() || null,
          estimatedCost: form.estimatedCost.trim() === "" ? null : Number(form.estimatedCost),
          approvalStatus: "Submitted",
          procurementStatus: form.procurementStatus,
          dateSupplied: form.dateSupplied || null,
        });
        toast.success("Purchase request created.");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save purchase request.");
    }
  }

  async function closeRequest(r: PurchaseRequest) {
    if (r.procurementStatus === "Closed") return;
    try {
      await updatePurchaseRequest(r.id, {
        procurementStatus: "Closed",
        approvalStatus: "Closed",
        dateSupplied: r.dateSupplied ?? new Date().toISOString().slice(0, 10),
      });
      toast.success("Request closed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to close request.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this purchase request? This cannot be undone.")) return;
    try {
      await deletePurchaseRequest(id);
      toast.success("Purchase request deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  }

  return (
    <div>
      <Header
        helpTopic="purchaseRequests"
        title="Purchase Requests"
        description="Section-initiated procurement requests with workflow status, approval and procurement tracking."
        actions={<div className="flex items-center gap-2"><ExportButton /><Button onClick={openCreate}>+ New Purchase Request</Button></div>}
      />
      <div className="p-6 space-y-4">
        {sorted.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Date</th><th className="p-2">Section</th><th className="p-2">Requested by</th><th className="p-2">Item</th>
                  <th className="p-2 text-right">Qty</th><th className="p-2 text-right">Current</th><th className="p-2 text-right">Avg/mo</th>
                  <th className="p-2">Urgency</th><th className="p-2">Approval</th><th className="p-2">Procurement</th><th className="p-2">Date supplied</th><th className="p-2">Justification</th><th className="p-2">Close</th><th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 text-xs">{r.requestDate}</td><td className="p-2 text-xs">{SECTION_NAME[r.requestingSection]}</td><td className="p-2 text-xs">{r.requestedBy}</td>
                    <td className="p-2 font-medium">{r.itemName}</td><td className="p-2 text-right tabular-nums">{r.quantityRequested}</td><td className="p-2 text-right tabular-nums">{r.currentStock}</td>
                    <td className="p-2 text-right tabular-nums">{r.averageMonthlyUsage}</td><td className="p-2"><StatusBadge label={r.urgency} tone={toneForCriticality(r.urgency)} /></td>
                    <td className="p-2"><StatusBadge label={r.approvalStatus} tone={r.approvalStatus === "Approved" ? "success" : r.approvalStatus === "Rejected" ? "destructive" : "info"} /></td>
                    <td className="p-2"><StatusBadge label={r.procurementStatus} tone={toneForProcurementStatus(r.procurementStatus)} /></td>
                    <td className="p-2 text-xs">{r.dateSupplied ?? NOT_DOCUMENTED}</td>
                    <td className="p-2 text-xs">{r.justification || NOT_DOCUMENTED}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant={r.procurementStatus === "Closed" ? "secondary" : "default"}
                        disabled={r.procurementStatus === "Closed"}
                        onClick={() => closeRequest(r)}
                      >
                        {r.procurementStatus === "Closed" ? "Closed" : "Close"}
                      </Button>
                    </td>
                    <td className="p-2"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>Delete</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit purchase request" : "Add purchase request"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Item / description *</Label><Input value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} /></div>
            <div><Label>Request date *</Label><Input type="date" value={form.requestDate} onChange={(e) => setForm((f) => ({ ...f, requestDate: e.target.value }))} /></div>
            <div><Label>Requesting section *</Label><Select value={form.requestingSection} onValueChange={(v) => setForm((f) => ({ ...f, requestingSection: v as PurchaseRequest["requestingSection"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Quantity *</Label><Input type="number" min={1} value={form.quantityRequested} onChange={(e) => setForm((f) => ({ ...f, quantityRequested: e.target.value }))} /></div>
            <div><Label>Urgency *</Label><Select value={form.urgency} onValueChange={(v) => setForm((f) => ({ ...f, urgency: v as Criticality }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{URGENCY.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Procurement status</Label><Input value={form.procurementStatus} onChange={(e) => setForm((f) => ({ ...f, procurementStatus: e.target.value as PurchaseRequest["procurementStatus"] }))} /></div>
            <div><Label>Current stock</Label><Input type="number" min={0} value={form.currentStock} onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))} /></div>
            <div><Label>Average monthly usage</Label><Input type="number" min={0} value={form.averageMonthlyUsage} onChange={(e) => setForm((f) => ({ ...f, averageMonthlyUsage: e.target.value }))} /></div>
            <div><Label>Supplier preference</Label><Input value={form.supplierPreference} onChange={(e) => setForm((f) => ({ ...f, supplierPreference: e.target.value }))} /></div>
            <div><Label>Estimated cost</Label><Input type="number" min={0} value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Justification</Label><Textarea value={form.justification} onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))} rows={3} /></div>
            {editing && <div><Label>Approval status</Label><Select value={form.approvalStatus} onValueChange={(v) => setForm((f) => ({ ...f, approvalStatus: v as PurchaseRequestStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPROVAL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{editing ? "Save changes" : "Create request"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
