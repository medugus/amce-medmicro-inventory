import { useMemo, useState } from "react";
import { AMCE_SECTIONS, SECTION_NAME } from "@/data/amceSections";
import { Header } from "@/components/layout/Header";
import { SearchInput } from "@/components/common/SearchInput";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const inventory = useInventory();
  const batches = useBatches();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const rows = useMemo(() => inventory.filter((i) => {
    if (search && !`${i.itemName} ${i.category} ${i.manufacturer ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (section !== ALL && i.laboratorySection !== section) return false;
    return true;
  }), [search, section, inventory]);

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
        <div className="flex flex-wrap gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search item, manufacturer..." />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {AMCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? <EmptyState /> : (
          <div className="border border-border rounded-md overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Manufacturer</th>
                  <th className="p-2">Cat. No.</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 text-right">Available</th>
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
                  return (
                    <tr key={i.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{i.itemName}</td>
                      <td className="p-2 text-xs">{i.category}</td>
                      <td className="p-2 text-xs">{SECTION_NAME[i.laboratorySection]}</td>
                      <td className="p-2 text-xs">{i.manufacturer ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.catalogueNumber ?? <span className="text-muted-foreground">{NOT_DOCUMENTED}</span>}</td>
                      <td className="p-2 text-xs">{i.unitOfIssue}</td>
                      <td className="p-2 text-right tabular-nums">{avail}</td>
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
    </div>
  );
}
