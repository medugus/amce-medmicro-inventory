import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildCriticalActions, PRIORITY_ORDER, type ActionGroup } from "@/logic/criticalActions";

const ALL = "__all";

const GROUP_ORDER: ActionGroup[] = [
  "Critical stock-out or low stock",
  "Pending procurement",
  "Partially supplied items",
  "Expired stock",
  "Batches pending acceptance",
  "Quarantined or rejected stock",
  "Missing documentation",
  "Equipment maintenance or calibration due",
  "Section forecasts requiring review",
];

export function CriticalActionsPage() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState(ALL);
  const [group, setGroup] = useState(ALL);

  const actions = useMemo(() => buildCriticalActions(), []);

  const filtered = actions.filter((a) => {
    if (search && !`${a.itemOrAsset} ${a.section} ${a.responsible} ${a.reason}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (priority !== ALL && a.priority !== priority) return false;
    if (group !== ALL && a.group !== group) return false;
    return true;
  });

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    rows: filtered
      .filter((a) => a.group === g)
      .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)),
  })).filter((s) => s.rows.length > 0);

  return (
    <div>
      <Header
        title="Critical Actions"
        description="Live list of items requiring immediate operational attention, derived from supply, inventory, quality and equipment data."
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, section, person..." />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-72 h-9"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All groups</SelectItem>
              {GROUP_ORDER.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground ml-auto">{filtered.length} actions</div>
        </div>

        {grouped.length === 0 ? (
          <EmptyState title="No critical actions are open." description="All tracked supply, inventory and quality signals are within thresholds." />
        ) : (
          <div className="space-y-6">
            {grouped.map((g) => (
              <section key={g.group}>
                <h2 className="text-sm font-semibold text-foreground mb-2">{g.group} <span className="text-muted-foreground font-normal">({g.rows.length})</span></h2>
                <div className="border border-border rounded-md overflow-x-auto bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2">Priority</th>
                        <th className="p-2">Item or asset</th>
                        <th className="p-2">Section</th>
                        <th className="p-2">Responsible</th>
                        <th className="p-2">Reason</th>
                        <th className="p-2">Recommended next step</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((a) => (
                        <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-2"><StatusBadge label={a.priority} tone={toneForCriticality(a.priority)} /></td>
                          <td className="p-2 font-medium">{a.itemOrAsset}</td>
                          <td className="p-2 text-xs">{a.section}</td>
                          <td className="p-2 text-xs">{a.responsible}</td>
                          <td className="p-2 text-xs">{a.reason}</td>
                          <td className="p-2 text-xs">{a.nextStep}</td>
                          <td className="p-2 text-xs">{a.status}</td>
                        </tr>
                      ))}
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
