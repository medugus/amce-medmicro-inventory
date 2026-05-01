import { useMemo, useState } from "react";
import { AMCE_SUPPLY_STATUS } from "@/data/amceSupplyStatus";
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

const ALL = "__all";

export function SupplyStatusPage() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState(ALL);
  const [supplyFilter, setSupplyFilter] = useState(ALL);
  const [procFilter, setProcFilter] = useState(ALL);
  const [critFilter, setCritFilter] = useState(ALL);
  const [missingOnly, setMissingOnly] = useState(false);

  const rows = useMemo(() => {
    return AMCE_SUPPLY_STATUS.filter((r) => {
      if (search && !`${r.itemName} ${r.category} ${r.responsiblePerson}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (section !== ALL && r.laboratorySection !== section) return false;
      if (supplyFilter !== ALL && r.supplyStatus !== supplyFilter) return false;
      if (procFilter !== ALL && r.procurementStatus !== procFilter) return false;
      if (critFilter !== ALL && r.criticality !== critFilter) return false;
      if (missingOnly && supplyStatusFlags(r).length === 0) return false;
      return true;
    });
  }, [search, section, supplyFilter, procFilter, critFilter, missingOnly]);

  const supplyValues = Array.from(new Set(AMCE_SUPPLY_STATUS.map((s) => s.supplyStatus)));
  const procValues = Array.from(new Set(AMCE_SUPPLY_STATUS.map((s) => s.procurementStatus)));

  return (
    <div>
      <Header
        title="AMCE Supply Status"
        description="Tracks requested, pending, ordered, and supplied items. These are not usable inventory until received and accepted."
        actions={<ExportButton />}
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, category, person..." />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={supplyFilter} onValueChange={setSupplyFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Supply status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All supply statuses</SelectItem>
              {supplyValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={procFilter} onValueChange={setProcFilter}>
            <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Procurement status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All procurement statuses</SelectItem>
              {procValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={critFilter} onValueChange={setCritFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Criticality" /></SelectTrigger>
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
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Responsible</th>
                  <th className="p-2 text-right">Req</th>
                  <th className="p-2 text-right">Sup</th>
                  <th className="p-2 text-right">Outstanding</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Supply</th>
                  <th className="p-2">Procurement</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Crit.</th>
                  <th className="p-2">Flags</th>
                  <th className="p-2">Action required</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const flags = supplyStatusFlags(r);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2">
                        <div className="font-medium">{r.itemName}</div>
                        <div className="text-xs text-muted-foreground">{r.category}</div>
                      </td>
                      <td className="p-2">{SECTION_NAME[r.laboratorySection]}</td>
                      <td className="p-2">{r.responsiblePerson}</td>
                      <td className="p-2 text-right tabular-nums">{r.requestedQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-right tabular-nums">{r.suppliedQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-right tabular-nums">{r.outstandingQuantity ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{r.unitOfIssue}</td>
                      <td className="p-2"><StatusBadge label={r.supplyStatus} tone={toneForSupplyStatus(r.supplyStatus)} /></td>
                      <td className="p-2"><StatusBadge label={r.procurementStatus} tone={toneForProcurementStatus(r.procurementStatus)} /></td>
                      <td className="p-2 text-xs">{r.supplier ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2"><StatusBadge label={r.criticality} tone={toneForCriticality(r.criticality)} /></td>
                      <td className="p-2">
                        {flags.length === 0 ? <span className="text-xs text-muted-foreground">None</span> : (
                          <div className="flex flex-col gap-0.5">
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
        )}
      </div>
    </div>
  );
}
