import { useMemo, useState } from "react";
import { useSupplyStatus } from "@/lib/useLiveData";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  StatusBadge,
  toneForCriticality,
  toneForProcurementStatus,
  toneForSupplyStatus,
} from "@/components/common/StatusBadge";
import { actionRequired, supplyStatusFlags } from "@/logic/supplyStatus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOT_DOCUMENTED } from "@/data/categories";
import type { SupplyStatus, ProcurementStatus, SupplyStatusRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSupplyRecord } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";

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

const ALL = "__all";

const STATUS_GROUPS: SupplyStatus[] = [
  "Pending procurement",
  "Ordered",
  "Partially supplied",
  "Supplied",
  "Delayed",
  "Requires clarification",
  "Cancelled",
];

export function SupplyStatusPage() {
  const supply = useSupplyStatus();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState(ALL);
  const [responsible, setResponsible] = useState(ALL);
  const [supplyFilter, setSupplyFilter] = useState(ALL);
  const [procFilter, setProcFilter] = useState(ALL);
  const [critFilter, setCritFilter] = useState(ALL);
  const [missingOnly, setMissingOnly] = useState(false);

  // Edit dialog state
  const [editing, setEditing] = useState<SupplyStatusRecord | null>(null);
  const [eSupply, setESupply] = useState<SupplyStatus>("Requested");
  const [eProc, setEProc] = useState<ProcurementStatus>("Not started");
  const [eSupplied, setESupplied] = useState<string>("");
  const [eOutstanding, setEOutstanding] = useState<string>("");
  const [eSupplier, setESupplier] = useState<string>("");
  const [eDateOrdered, setEDateOrdered] = useState<string>("");
  const [eDateSupplied, setEDateSupplied] = useState<string>("");
  const [eRemarks, setERemarks] = useState<string>("");
  const [eReason, setEReason] = useState<string>("");
  const [eSubmitting, setESubmitting] = useState(false);

  function startEdit(r: SupplyStatusRecord) {
    setEditing(r);
    setESupply(r.supplyStatus);
    setEProc(r.procurementStatus);
    setESupplied(r.suppliedQuantity?.toString() ?? "");
    setEOutstanding(r.outstandingQuantity?.toString() ?? "");
    setESupplier(r.supplier ?? "");
    setEDateOrdered(r.dateOrdered ?? "");
    setEDateSupplied(r.dateSupplied ?? "");
    setERemarks(r.remarks);
    setEReason("");
  }

  async function saveEdit() {
    if (!editing) return;
    const user = getCurrentUser();
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!eReason.trim()) { toast.error("A reason for the update is required for the audit trail."); return; }
    setESubmitting(true);
    try {
      await updateSupplyRecord({
        id: editing.id,
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
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
    } finally { setESubmitting(false); }
  }

  const responsibles = useMemo(
    () => Array.from(new Set(supply.map((s) => s.responsiblePerson))).sort(),
    [supply]
  );

  const rows = useMemo(() => {
    return supply.filter((r) => {
      if (search && !`${r.itemName} ${r.category} ${r.responsiblePerson}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (section !== ALL && r.laboratorySection !== section) return false;
      if (responsible !== ALL && r.responsiblePerson !== responsible) return false;
      if (supplyFilter !== ALL && r.supplyStatus !== supplyFilter) return false;
      if (procFilter !== ALL && r.procurementStatus !== procFilter) return false;
      if (critFilter !== ALL && r.criticality !== critFilter) return false;
      if (missingOnly && supplyStatusFlags(r).length === 0) return false;
      return true;
    });
  }, [supply, search, section, responsible, supplyFilter, procFilter, critFilter, missingOnly]);

  const supplyValues = Array.from(new Set(supply.map((s) => s.supplyStatus)));
  const procValues = Array.from(new Set(supply.map((s) => s.procurementStatus)));

  const grouped = STATUS_GROUPS.map((g) => ({
    status: g,
    rows: rows.filter((r) => r.supplyStatus === g),
  })).filter((g) => g.rows.length > 0);

  // Catch-all for any status not in STATUS_GROUPS (e.g., Requested, Under review, Not supplied)
  const otherRows = rows.filter((r) => !STATUS_GROUPS.includes(r.supplyStatus));
  if (otherRows.length > 0) grouped.push({ status: "Other" as SupplyStatus, rows: otherRows });

  return (
    <div>
      <Header
        title="AMCE Supply Status"
        description="Tracks requested, pending, ordered, and supplied items, grouped by supply status. These are not usable inventory until received and accepted."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, category, person..." />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={responsible} onValueChange={setResponsible}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Responsible" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All responsible</SelectItem>
              {responsibles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={supplyFilter} onValueChange={setSupplyFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Supply status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All supply statuses</SelectItem>
              {supplyValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={procFilter} onValueChange={setProcFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Procurement status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All procurement statuses</SelectItem>
              {procValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={critFilter} onValueChange={setCritFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Criticality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All criticalities</SelectItem>
              {["Critical", "High", "Medium", "Low"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="text-xs flex items-center gap-1.5 ml-2">
            <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            Only with missing documentation
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <section key={g.status}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-sm font-semibold">{g.status}</h2>
                  <span className="text-xs text-muted-foreground">({g.rows.length})</span>
                </div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => {
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
