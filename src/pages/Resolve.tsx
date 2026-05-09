import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { useBatches, useDataReady, useEquipment, useDurables, useInventory } from "@/lib/useLiveData";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_DURABLES, AMCE_EQUIPMENT } from "@/data/amceAssets";
import { SECTION_NAME } from "@/data/amceSections";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { QrEntityType } from "@/lib/qrLinks";
import { targetRouteFor } from "@/lib/qrLinks";

export function ResolvePage() {
  const { type, id } = useParams({ from: "/r/$type/$id" });
  const batches = useBatches();
  const items = useInventory();
  const equipment = useEquipment();
  const durables = useDurables();
  const dataReady = useDataReady();
  const lookupBatches = batches.length ? batches : AMCE_BATCHES;
  const lookupItems = items.length ? items : AMCE_INVENTORY_MASTER;
  const lookupEquipment = equipment.length ? equipment : AMCE_EQUIPMENT;
  const lookupDurables = durables.length ? durables : AMCE_DURABLES;
  const [autoNav, setAutoNav] = useState(false);

  const record = useMemo(() => {
    switch (type as QrEntityType) {
      case "batch": {
        const b = lookupBatches.find((x) => x.id === id);
        if (!b) return null;
        const item = lookupItems.find((i) => i.id === b.inventoryItemId);
        return {
          title: `Batch ${b.batchNumber}`,
          subtitle: item?.itemName ?? "Unknown item",
          fields: [
            ["Lot number", b.lotNumber ?? "—"],
            ["Status", b.batchStatus],
            ["Quantity available", String(b.quantityAvailable)],
            ["Expiry", b.expiryDate ?? "—"],
            ["Storage", b.storageLocation],
            ["Section", item ? SECTION_NAME[item.laboratorySection] : "—"],
          ] as [string, string][],
        };
      }
      case "item": {
        const i = lookupItems.find((x) => x.id === id);
        if (!i) return null;
        return {
          title: i.itemName,
          subtitle: i.category,
          fields: [
            ["Section", SECTION_NAME[i.laboratorySection]],
            ["Unit", i.unitOfIssue],
            ["Manufacturer", i.manufacturer ?? "—"],
            ["Reorder level", String(i.reorderLevel)],
            ["Criticality", i.criticality],
          ] as [string, string][],
        };
      }
      case "equipment": {
        const e = lookupEquipment.find((x) => x.id === id);
        if (!e) return null;
        return {
          title: e.equipmentName,
          subtitle: e.equipmentCategory,
          fields: [
            ["Manufacturer / Model", `${e.manufacturer ?? "—"} / ${e.model ?? "—"}`],
            ["Serial", e.serialNumber ?? "—"],
            ["Asset #", e.assetNumber ?? "—"],
            ["Section", SECTION_NAME[e.laboratorySection]],
            ["Location", e.location ?? "—"],
            ["Status", e.operationalStatus],
            ["Next calibration", e.nextCalibrationDueDate ?? "—"],
            ["Next maintenance", e.nextMaintenanceDueDate ?? "—"],
          ] as [string, string][],
        };
      }
      case "durable": {
        const d = lookupDurables.find((x) => x.id === id);
        if (!d) return null;
        return {
          title: d.assetName,
          subtitle: d.assetCategory,
          fields: [
            ["Section", SECTION_NAME[d.laboratorySection]],
            ["Location", d.location ?? "—"],
            ["Quantity", d.quantity != null ? String(d.quantity) : "—"],
            ["Condition", d.condition],
            ["Responsible officer", d.responsibleOfficer ?? "—"],
          ] as [string, string][],
        };
      }
      default:
        return null;
    }
  }, [type, id, lookupBatches, lookupItems, lookupEquipment, lookupDurables]);

  const targetRoute = targetRouteFor(type as QrEntityType);

  useEffect(() => {
    setAutoNav(true);
  }, [id]);

  if (!dataReady) {
    return (
      <div>
        <Header title="Opening scanned record" description="Checking the local register for this code." />
        <div className="p-6 text-sm text-muted-foreground">Loading register…</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div>
        <Header title="Record not found" description={`No ${type} matching "${id}" in the local register.`} />
        <div className="p-6">
          <div className="bg-card border border-border rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">This QR code does not match any current record.</div>
              <p className="text-muted-foreground mt-1">It may have been deleted, or the database hasn't synced on this device yet. Try refreshing or open the relevant register manually.</p>
              <div className="mt-3 flex gap-2">
                <Link to="/scan" className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Scan another</Link>
                <Link to="/" className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={record.title}
        description={record.subtitle}
        actions={
          <Link
            to={targetRoute}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1"
          >
            Open full register <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <div className="p-6 max-w-2xl space-y-4">
        <div className="bg-card border border-border rounded-md p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Record details</div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {record.fields.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
            ID: <span className="font-mono">{id}</span>
            {autoNav && <span className="ml-2">• Resolved from QR scan</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/scan" className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">Scan another</Link>
        </div>
      </div>
    </div>
  );
}
