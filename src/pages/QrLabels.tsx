import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Printer, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBatches, useEquipment, useDurables, useInventory, useGtinCatalogue } from "@/lib/useLiveData";
import { buildQrUrl, type QrEntityType } from "@/lib/qrLinks";
import { SECTION_NAME } from "@/data/amceSections";
import { upsertGtinEntry, deleteGtinEntry } from "@/lib/gtinActions";
import type { GtinCatalogueEntry, GtinCategory } from "@/types";

type LabelRow = {
  type: QrEntityType;
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  url: string;
};

const GTIN_CATEGORIES: GtinCategory[] = ["culture media", "reagent", "consumable", "PPE", "equipment", "other"];

export function QrLabelsPage() {
  const [tab, setTab] = useState<"labels" | "gtin">("labels");

  return (
    <div>
      <Header
        title="QR Labels"
        description="Generate printable QR labels for batches, equipment, durables and inventory items, and manage your GTIN catalogue."
        actions={
          tab === "labels" ? (
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList className="print:hidden">
            <TabsTrigger value="labels">Printable labels</TabsTrigger>
            <TabsTrigger value="gtin">GTIN catalogue</TabsTrigger>
          </TabsList>
          <TabsContent value="labels"><LabelsTab /></TabsContent>
          <TabsContent value="gtin"><GtinTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LabelsTab() {
  const [type, setType] = useState<QrEntityType>("batch");
  const [search, setSearch] = useState("");
  const batches = useBatches();
  const items = useInventory();
  const equipment = useEquipment();
  const durables = useDurables();

  const rows = useMemo<LabelRow[]>(() => {
    const list: LabelRow[] = (() => {
      if (type === "batch") {
        return batches.map((b) => {
          const item = items.find((i) => i.id === b.inventoryItemId);
          return {
            type: "batch" as const,
            id: b.id,
            title: item?.itemName ?? "Unknown item",
            subtitle: `Batch ${b.batchNumber}${b.lotNumber ? ` • Lot ${b.lotNumber}` : ""}`,
            meta: `Exp ${b.expiryDate ?? "—"} • ${b.storageLocation}`,
            url: buildQrUrl("batch", b.id),
          };
        });
      }
      if (type === "equipment") {
        return equipment.map((e) => ({
          type: "equipment" as const,
          id: e.id,
          title: e.equipmentName,
          subtitle: `${e.manufacturer ?? "—"} ${e.model ?? ""}`.trim(),
          meta: `${SECTION_NAME[e.laboratorySection]} • SN ${e.serialNumber ?? "—"}`,
          url: buildQrUrl("equipment", e.id),
        }));
      }
      if (type === "durable") {
        return durables.map((d) => ({
          type: "durable" as const,
          id: d.id,
          title: d.assetName,
          subtitle: d.assetCategory,
          meta: `${SECTION_NAME[d.laboratorySection]} • ${d.location ?? "—"}`,
          url: buildQrUrl("durable", d.id),
        }));
      }
      return items.map((i) => ({
        type: "item" as const,
        id: i.id,
        title: i.itemName,
        subtitle: i.category,
        meta: `${SECTION_NAME[i.laboratorySection]} • Reorder ${i.reorderLevel}`,
        url: buildQrUrl("item", i.id),
      }));
    })();
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r) => `${r.title} ${r.subtitle} ${r.meta} ${r.id}`.toLowerCase().includes(q));
  }, [type, search, batches, items, equipment, durables]);

  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      rows.map(async (r) => [r.id, await QRCode.toDataURL(r.url, { margin: 1, width: 256 })] as const)
    ).then((entries) => {
      if (!cancelled) setDataUrls(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Select value={type} onValueChange={(v) => setType(v as QrEntityType)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="batch">Batches / Lots</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="durable">Durable assets</SelectItem>
            <SelectItem value="item">Inventory items</SelectItem>
          </SelectContent>
        </Select>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, location…" />
        <div className="text-xs text-muted-foreground self-center">{rows.length} labels</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:gap-2 print:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="bg-card border border-border rounded-md p-3 flex flex-col items-center text-center break-inside-avoid print:border-black"
          >
            {dataUrls[r.id] ? (
              <img src={dataUrls[r.id]} alt={`QR for ${r.title}`} className="w-32 h-32" />
            ) : (
              <div className="w-32 h-32 bg-muted animate-pulse rounded" />
            )}
            <div className="mt-2 text-xs font-semibold leading-tight line-clamp-2">{r.title}</div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{r.subtitle}</div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{r.meta}</div>
            <div className="text-[9px] font-mono text-muted-foreground mt-1 truncate w-full">{r.id}</div>
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="text-sm text-muted-foreground py-12 text-center">No records to label.</div>
      )}
    </div>
  );
}

function GtinTab() {
  const catalogue = useGtinCatalogue();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<GtinCatalogueEntry | null>(null);

  const rows = useMemo(() => {
    if (!search) return catalogue;
    const q = search.toLowerCase();
    return catalogue.filter((e) =>
      `${e.gtin} ${e.productName} ${e.manufacturer ?? ""} ${e.unit ?? ""} ${e.category ?? ""}`.toLowerCase().includes(q)
    );
  }, [catalogue, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search GTIN, product, manufacturer…" />
        <div className="text-xs text-muted-foreground">{rows.length} entries</div>
      </div>

      <div className="bg-card border border-border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GTIN</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No GTINs saved yet — scan supplier barcodes to build the catalogue.
                </TableCell>
              </TableRow>
            )}
            {rows.map((e) => (
              <TableRow key={e.gtin}>
                <TableCell className="font-mono text-xs">{e.gtin}</TableCell>
                <TableCell>{e.productName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.manufacturer ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.unit ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.category ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(e.lastSeenAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(e)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={async () => {
                        if (!confirm(`Delete GTIN ${e.gtin} (${e.productName})?`)) return;
                        await deleteGtinEntry(e.gtin);
                        toast.success("Deleted from catalogue.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditGtinDialog entry={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditGtinDialog({ entry, onClose }: { entry: GtinCatalogueEntry | null; onClose: () => void }) {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GtinCategory>("reagent");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setProductName(entry.productName);
    setManufacturer(entry.manufacturer ?? "");
    setUnit(entry.unit ?? "");
    setCategory((entry.category as GtinCategory) ?? "reagent");
  }, [entry]);

  async function save() {
    if (!entry) return;
    if (!productName.trim()) {
      toast.error("Product name is required.");
      return;
    }
    setSaving(true);
    try {
      await upsertGtinEntry({
        gtin: entry.gtin,
        productName: productName.trim(),
        manufacturer: manufacturer.trim() || null,
        unit: unit.trim() || null,
        category,
        inventoryItemId: entry.inventoryItemId,
      });
      toast.success("Updated catalogue entry.");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!entry} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit GTIN</DialogTitle>
          <DialogDescription className="font-mono text-xs">{entry?.gtin}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Product name</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Manufacturer</Label>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as GtinCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GTIN_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
