import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupplyStatus, useInventory } from "@/lib/useLiveData";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { supplyStatusFlags } from "@/logic/supplyStatus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SupplyStatus, SupplyStatusRecord } from "@/types";
import { SupplyEditDialog } from "@/components/supply/SupplyEditDialog";
import { SupplyTable } from "@/components/supply/SupplyTable";
import { ReceiveBatchDialog } from "@/components/forms/ReceiveBatchDialog";
import { createInventoryItem } from "@/lib/actions";
import { toast } from "sonner";

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
  const inventory = useInventory();
  const [receiveItemId, setReceiveItemId] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  async function handlePromote(r: SupplyStatusRecord) {
    if (promoting) return;
    setPromoting(true);
    try {
      const match = inventory.find(
        (i) => i.itemName.trim().toLowerCase() === r.itemName.trim().toLowerCase(),
      );
      let itemId = match?.id;
      if (!itemId) {
        const created = await createInventoryItem({
          itemName: r.itemName,
          category: r.category,
          laboratorySection: r.laboratorySection,
          unitOfIssue: r.unitOfIssue,
          manufacturer: null,
          supplier: r.supplier,
          catalogueNumber: null,
          reorderLevel: 0,
          minimumStock: 0,
          maximumStock: 0,
          storageCondition: "",
          criticality: r.criticality,
          active: true,
          notes: `Promoted from supply request on ${new Date().toISOString().slice(0, 10)}`,
        });
        itemId = created.id;
        toast.success(`Added "${r.itemName}" to Inventory Master.`);
      }
      setReceiveItemId(itemId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not promote to inventory.");
    } finally {
      setPromoting(false);
    }
  }

  const [search, setSearch] = useState("");
  const [section, setSection] = useState(ALL);
  const [responsible, setResponsible] = useState(ALL);
  const [supplyFilter, setSupplyFilter] = useState(ALL);
  const [procFilter, setProcFilter] = useState(ALL);
  const [critFilter, setCritFilter] = useState(ALL);
  const [missingOnly, setMissingOnly] = useState(false);
  const [editing, setEditing] = useState<SupplyStatusRecord | null>(null);

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

  const otherRows = rows.filter((r) => !STATUS_GROUPS.includes(r.supplyStatus));
  if (otherRows.length > 0) grouped.push({ status: "Other" as SupplyStatus, rows: otherRows });

  return (
    <div>
      <Header
        helpTopic="supplyStatus"
        title="AMCE Supply Status"
        description="Tracks requested, pending, ordered, and supplied items, grouped by supply status. These are not usable inventory until received and accepted."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/scan">
                <ScanLine className="h-4 w-4 mr-1" />
                Scan barcode
              </Link>
            </Button>
            <ExportButton />
          </div>
        }
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
                <SupplyTable rows={g.rows} onEdit={setEditing} onPromote={handlePromote} />
              </section>
            ))}
          </div>
        )}
      </div>

      <SupplyEditDialog record={editing} onClose={() => setEditing(null)} />
      <ReceiveBatchDialog
        open={receiveItemId !== null}
        onOpenChange={(o) => { if (!o) setReceiveItemId(null); }}
        defaultInventoryItemId={receiveItemId ?? ""}
      />
    </div>
  );
}
