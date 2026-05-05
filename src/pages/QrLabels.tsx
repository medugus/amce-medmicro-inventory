import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { Printer } from "lucide-react";
import { useBatches, useEquipment, useDurables, useInventory } from "@/lib/useLiveData";
import { buildQrUrl, type QrEntityType } from "@/lib/qrLinks";
import { SECTION_NAME } from "@/data/amceSections";

type LabelRow = {
  type: QrEntityType;
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  url: string;
};

export function QrLabelsPage() {
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
    <div>
      <Header
        title="QR Labels"
        description="Generate printable QR labels for batches, equipment, durables and inventory items. Scan with the Scan page or any phone camera to open the record."
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        }
      />
      <div className="p-6 space-y-4">
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
    </div>
  );
}
