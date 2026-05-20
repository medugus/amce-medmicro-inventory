import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Mail, Send } from "lucide-react";
import { usePurchaseRequests } from "@/lib/useLiveData";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { SECTION_NAME } from "@/data/amceSections";
import { NOT_DOCUMENTED } from "@/data/categories";
import { PurchaseRequestDialog } from "@/components/forms/PurchaseRequestDialog";
import { deletePurchaseRequest, markPurchaseRequestsEmailed } from "@/lib/actions";
import { useProcurementRecipients } from "@/lib/settings";
import { toast } from "sonner";
import type { PurchaseRequest } from "@/types";

// Opens a mailto: link reliably, including inside sandboxed preview iframes
// where assigning to window.location.href is silently blocked.
function openMailto(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function PurchaseRequestsPage() {
  const rows = usePurchaseRequests();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { labManager, headOfUnit } = useProcurementRecipients();

  const { active, sent } = useMemo(() => {
    const active: PurchaseRequest[] = [];
    const sent: PurchaseRequest[] = [];
    for (const r of rows) (r.emailedAt ? sent : active).push(r);
    sent.sort((a, b) => (b.emailedAt ?? "").localeCompare(a.emailedAt ?? ""));
    return { active, sent };
  }, [rows]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === active.length) setSelected(new Set());
    else setSelected(new Set(active.map((r) => r.id)));
  }

  async function onEmailSelected() {
    const picked = active.filter((r) => selected.has(r.id));
    if (picked.length === 0) { toast.error("Select at least one request to email."); return; }
    const to = [labManager, headOfUnit].filter(Boolean).join(",");
    if (!to) { toast.error("Set recipient emails in Settings first."); return; }
    const subject = `Purchase requests digest — ${picked.length} item${picked.length === 1 ? "" : "s"} (${new Date().toLocaleDateString()})`;
    const header = ["Date", "Section", "Requested by", "Item", "Preferred mfr.", "Qty/unit", "Units", "Total", "Current", "Avg/mo", "Urgency", "Approval"].join(" | ");
    const sep = header.replace(/[^|]/g, "-");
    const body = [
      "Dear Lab Manager and Head of Unit,",
      "",
      `Please find below ${picked.length} purchase request${picked.length === 1 ? "" : "s"} for your review and approval.`,
      "",
      header,
      sep,
      ...picked.map((r) => [
        r.requestDate, SECTION_NAME[r.requestingSection], r.requestedBy, r.itemName,
        r.preferredManufacturer || NOT_DOCUMENTED, r.quantityPerUnit, r.unitsRequired,
        r.quantityRequested, r.currentStock, r.averageMonthlyUsage, r.urgency, r.approvalStatus,
      ].join(" | ")),
      "",
      "Kind regards,",
    ].join("\n");
    openMailto(`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    try {
      await markPurchaseRequestsEmailed(picked.map((r) => r.id));
      setSelected(new Set());
      toast.success(`Email drafted for ${picked.length} request${picked.length === 1 ? "" : "s"}. Moved to Sent.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark as sent.");
    }
  }

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

  function onEmail(r: PurchaseRequest) {
    const subject = `Purchase request: ${r.itemName} (${r.requestingSection})`;
    const lines = [
      "Dear Procurement Team,",
      "",
      "Please find the purchase request details below:",
      "",
      `Date: ${r.requestDate}`,
      `Section: ${SECTION_NAME[r.requestingSection]}`,
      `Requested by: ${r.requestedBy}`,
      `Item: ${r.itemName}`,
      `Preferred manufacturer: ${r.preferredManufacturer || NOT_DOCUMENTED}`,
      `Alternate manufacturer: ${r.alternateManufacturer || NOT_DOCUMENTED}`,
      `Quantity per unit: ${r.quantityPerUnit}`,
      `Units required: ${r.unitsRequired}`,
      `Total quantity requested: ${r.quantityRequested}`,
      `Current stock: ${r.currentStock}`,
      `Average monthly usage: ${r.averageMonthlyUsage}`,
      `Urgency: ${r.urgency}`,
      `Approval status: ${r.approvalStatus}`,
      `Procurement status: ${r.procurementStatus}`,
      `Justification: ${r.justification || NOT_DOCUMENTED}`,
      "",
      "Kind regards,",
      r.requestedBy,
    ];
    openMailto(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`);
  }

  const allSelected = active.length > 0 && selected.size === active.length;

  function renderRow(r: PurchaseRequest, opts: { selectable: boolean }) {
    return (
      <tr key={r.id} className="border-t border-border hover:bg-muted/30">
        <td className="p-2">
          {opts.selectable ? (
            <Checkbox
              checked={selected.has(r.id)}
              onCheckedChange={() => toggle(r.id)}
              aria-label={`Select ${r.itemName}`}
            />
          ) : null}
        </td>
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
          <Button size="icon" variant="ghost" onClick={() => onEmail(r)} aria-label="Email request">
            <Mail className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(r)} aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </td>
      </tr>
    );
  }

  function header(selectable: boolean) {
    return (
      <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="p-2 w-8">
            {selectable ? (
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
            ) : null}
          </th>
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
    );
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
            <Button size="sm" variant="outline" onClick={onEmailSelected} disabled={selected.size === 0}>
              <Send className="w-4 h-4 mr-1" />Email selected{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
            <ExportButton />
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {rows.length === 0 ? <EmptyState /> : (
          <>
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Active requests <span className="text-muted-foreground font-normal">({active.length})</span></h2>
                {selected.size > 0 ? (
                  <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                ) : null}
              </div>
              {active.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active requests — everything has been emailed.</p>
              ) : (
                <div className="border border-border rounded-md overflow-x-auto bg-card">
                  <table className="w-full text-sm">
                    {header(true)}
                    <tbody>{active.map((r) => renderRow(r, { selectable: true }))}</tbody>
                  </table>
                </div>
              )}
            </section>

            {sent.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Sent <span className="text-muted-foreground font-normal">({sent.length})</span></h2>
                <div className="border border-border rounded-md overflow-x-auto bg-card opacity-90">
                  <table className="w-full text-sm">
                    {header(false)}
                    <tbody>{sent.map((r) => renderRow(r, { selectable: false }))}</tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
      <PurchaseRequestDialog open={open} onOpenChange={setOpen} request={editing} />
    </div>
  );
}
