import { useMemo, useState } from "react";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { isLowStock, totalAvailableForItem } from "@/logic/inventory";
import { NOT_DOCUMENTED } from "@/data/categories";
import { useBatches, useInventory } from "@/lib/useLiveData";
import { InventoryItemDialog } from "@/components/forms/InventoryItemDialog";
import { deleteInventoryItem } from "@/lib/actions";
import { toast } from "sonner";
import type { InventoryItem } from "@/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL = "__all";

export function InventoryMasterPage() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState(ALL);
  const [noBatchesOnly, setNoBatchesOnly] = useState(false);
  const inventory = useInventory();
  const batches = useBatches();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const batchCountByItem = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of batches) m.set(b.inventoryItemId, (m.get(b.inventoryItemId) ?? 0) + 1);
    return m;
  }, [batches]);

  const rows = useMemo(() => inventory.filter((i) => {
    if (search && !`${i.itemName} ${i.category} ${i.manufacturer ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (section !== ALL && i.laboratorySection !== section) return false;
    if (noBatchesOnly && (batchCountByItem.get(i.id) ?? 0) > 0) return false;
    return true;
  }), [search, section, inventory, noBatchesOnly, batchCountByItem]);

  const visibleIds = rows.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteInventoryItem(deleting.id, deleteReason);
      toast.success("Inventory item deleted.");
      setDeleting(null);
      setDeleteReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  async function confirmBulkDelete() {
    if (!bulkReason.trim()) {
      toast.error("Reason is required for the audit trail.");
      return;
    }
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    let ok = 0, skipped = 0, failed = 0;
    const failures: string[] = [];
    for (const id of ids) {
      try {
        await deleteInventoryItem(id, bulkReason);
        ok++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        if (msg.includes("batches")) {
          skipped++;
        } else {
          failed++;
          const item = inventory.find((i) => i.id === id);
          failures.push(`${item?.itemName ?? id}: ${msg}`);
        }
      }
    }
    setBulkBusy(false);
    setBulkOpen(false);
    setBulkReason("");
    setSelectedIds(new Set());
    const parts: string[] = [];
    if (ok) parts.push(`${ok} deleted`);
    if (skipped) parts.push(`${skipped} skipped (had batches)`);
    if (failed) parts.push(`${failed} failed`);
    toast.success(parts.join(" · ") || "No changes.");
    if (failures.length) console.warn("Bulk delete failures:", failures);
  }

  const selectedCount = selectedIds.size;

  return (
    <div>
      <Header
        helpTopic="inventoryMaster"
        title="Inventory Master"
        description="Confirmed catalogue items used by AMCE Microbiology. Catalogue presence does not imply usable stock."
        actions={
          <>
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add item
            </Button>
            <ExportButton />
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, manufacturer..." />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="text-xs flex items-center gap-1.5 ml-2">
            <input type="checkbox" checked={noBatchesOnly} onChange={(e) => setNoBatchesOnly(e.target.checked)} />
            Only items with no batches ever received
          </label>
          {selectedCount > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
              <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete selected
              </Button>
            </div>
          )}
        </div>

        {rows.length === 0 ? <EmptyState title="No inventory items match." description="Add items via &quot;Add inventory item&quot;. Each item must exist here before you can receive batches or record movements for it." /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2 w-8">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Select all visible"
                    />
                  </th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Manufacturer</th>
                  <th className="p-2">Cat. No.</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 text-right">Available</th>
                  <th className="p-2 text-right">Batches</th>
                  <th className="p-2 text-right">Reorder</th>
                  <th className="p-2">Storage</th>
                  <th className="p-2">Crit.</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const avail = totalAvailableForItem(batches, i.id);
                  const low = isLowStock(i, batches);
                  const bc = batchCountByItem.get(i.id) ?? 0;
                  const checked = selectedIds.has(i.id);
                  return (
                    <tr key={i.id} className={`border-t border-border hover:bg-muted/30 ${checked ? "bg-accent/30" : ""}`}>
                      <td className="p-2">
                        <Checkbox checked={checked} onCheckedChange={() => toggleOne(i.id)} aria-label={`Select ${i.itemName}`} />
                      </td>
                      <td className="p-2 font-medium">{i.itemName}</td>
                      <td className="p-2 text-xs">{i.category}</td>
                      <td className="p-2 text-xs">{SECTION_NAME[i.laboratorySection]}</td>
                      <td className="p-2 text-xs">{i.manufacturer ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.catalogueNumber ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.unitOfIssue}</td>
                      <td className="p-2 text-right tabular-nums">{avail}</td>
                      <td className="p-2 text-right tabular-nums text-xs">{bc}</td>
                      <td className="p-2 text-right tabular-nums">{i.reorderLevel}</td>
                      <td className="p-2 text-xs">{i.storageCondition}</td>
                      <td className="p-2"><StatusBadge label={i.criticality} tone={toneForCriticality(i.criticality)} /></td>
                      <td className="p-2">
                        {low ? <StatusBadge label="Below reorder level" tone="warning" /> : <StatusBadge label="Adequate" tone="success" />}
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(i); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setDeleting(i); setDeleteReason(""); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InventoryItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.itemName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the catalogue entry from this computer. Items with batches recorded against
              them cannot be deleted — mark them inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label>Reason (audit trail)</Label>
            <Input value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkOpen} onOpenChange={(o) => { if (!o && !bulkBusy) { setBulkOpen(false); setBulkReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              Items with any batch recorded against them will be skipped automatically (the system
              protects stock history). One reason will be written to the audit trail for every deleted item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label>Reason (audit trail)</Label>
            <Input
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="e.g. Never used at AMCE — clean-up of legacy catalogue"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} disabled={bulkBusy}>
              {bulkBusy ? "Deleting..." : `Delete ${selectedCount}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
