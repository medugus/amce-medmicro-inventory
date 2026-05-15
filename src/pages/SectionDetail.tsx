import { Link, useParams } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, toneForCriticality } from "@/components/common/StatusBadge";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { expiryBucket, totalAvailableForItem } from "@/logic/inventory";
import { isCriticalRisk } from "@/logic/supplyStatus";
import {
  useBatches,
  useInventory,
  useSupplyStatus,
} from "@/lib/useLiveData";
import type { LaboratorySectionId } from "@/types";

export function SectionDetailPage() {
  const { sectionId } = useParams({ from: "/section/$sectionId" });
  const section = AMCE_SECTIONS.find((s) => s.id === (sectionId as LaboratorySectionId));

  const items = useInventory();
  const batches = useBatches();
  const supplies = useSupplyStatus();

  if (!section) {
    return (
      <div>
        <Header title="Unknown section" description="This bench does not exist." />
        <div className="p-6"><EmptyState title="Section not found." /></div>
      </div>
    );
  }

  const sectionItems = items.filter((i) => i.laboratorySection === section.id);
  const sectionItemIds = new Set(sectionItems.map((i) => i.id));
  const sectionBatches = batches.filter((b) => sectionItemIds.has(b.inventoryItemId));
  const sectionSupplies = supplies.filter((x) => x.laboratorySection === section.id);

  const lowStock = sectionItems
    .map((i) => ({ item: i, available: totalAvailableForItem(batches, i.id) }))
    .filter((r) => r.available <= r.item.reorderLevel)
    .sort((a, b) => (a.available - a.item.reorderLevel) - (b.available - b.item.reorderLevel));

  const expired = sectionBatches.filter(
    (b) => b.batchStatus === "Expired" || expiryBucket(b.expiryDate) === "expired"
  );
  const expiringSoon = sectionBatches.filter((b) => {
    const bucket = expiryBucket(b.expiryDate);
    return bucket === "30" && b.batchStatus !== "Expired";
  });
  const pendingAcc = sectionBatches.filter((b) => b.batchStatus === "Pending acceptance");
  const quarantined = sectionBatches.filter(
    (b) => b.batchStatus === "Quarantined" || b.batchStatus === "Rejected"
  );

  const openSupply = sectionSupplies.filter(
    (x) => x.supplyStatus !== "Supplied" && x.supplyStatus !== "Cancelled"
  );
  const criticalRisks = sectionSupplies.filter(isCriticalRisk);

  const itemName = (id: string) => items.find((i) => i.id === id)?.itemName ?? id;

  const total =
    lowStock.length +
    expired.length +
    expiringSoon.length +
    pendingAcc.length +
    quarantined.length +
    openSupply.length +
    criticalRisks.length;

  return (
    <div>
      <Header
        title={section.name}
        description={`${section.description} Lead: ${section.leads.join(", ")}.`}
        actions={
          <Link
            to="/"
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-accent"
          >
            ← Back to dashboard
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        {total === 0 && (
          <EmptyState title="Nothing needs attention on this bench right now. ✨" />
        )}

        <Section
          title="Critical supply risks"
          count={criticalRisks.length}
          tone="destructive"
          link={{ to: "/critical-actions", label: "Open critical actions" }}
        >
          {criticalRisks.length > 0 && (
            <SimpleTable
              headers={["Item", "Status", "Criticality"]}
              rows={criticalRisks.map((r) => [
                r.itemDescription ?? r.id,
                r.supplyStatus,
                <StatusBadge key="c" label={r.criticality} tone={toneForCriticality(r.criticality)} />,
              ])}
            />
          )}
        </Section>

        <Section
          title="Low stock / below reorder level"
          count={lowStock.length}
          tone="warning"
          link={{ to: "/low-stock-reorder", label: "Open reorder list" }}
        >
          {lowStock.length > 0 && (
            <SimpleTable
              headers={["Item", "Available", "Reorder", "Suggested order", "Crit."]}
              rows={lowStock.map(({ item, available }) => [
                item.itemName,
                available,
                item.reorderLevel,
                Math.max(item.maximumStock - available, item.reorderLevel - available),
                <StatusBadge key="c" label={item.criticality} tone={toneForCriticality(item.criticality)} />,
              ])}
            />
          )}
        </Section>

        <Section
          title="Expired batches"
          count={expired.length}
          tone="destructive"
          link={{ to: "/expired-wasted-stock", label: "Open expired stock" }}
        >
          {expired.length > 0 && (
            <SimpleTable
              headers={["Item", "Lot", "Expiry", "Qty", "Status"]}
              rows={expired.map((b) => [
                itemName(b.inventoryItemId),
                b.lotNumber ?? "—",
                b.expiryDate ?? "—",
                b.quantityAvailable,
                b.batchStatus,
              ])}
            />
          )}
        </Section>

        <Section
          title="Expiring within 30 days"
          count={expiringSoon.length}
          tone="warning"
          link={{ to: "/expiry-fefo", label: "Open expiry / FEFO" }}
        >
          {expiringSoon.length > 0 && (
            <SimpleTable
              headers={["Item", "Lot", "Expiry", "Qty"]}
              rows={expiringSoon.map((b) => [
                itemName(b.inventoryItemId),
                b.lotNumber ?? "—",
                b.expiryDate ?? "—",
                b.quantityAvailable,
              ])}
            />
          )}
        </Section>

        <Section
          title="Pending acceptance testing"
          count={pendingAcc.length}
          tone="info"
          link={{ to: "/acceptance-testing", label: "Open acceptance testing" }}
        >
          {pendingAcc.length > 0 && (
            <SimpleTable
              headers={["Item", "Lot", "Expiry", "Qty"]}
              rows={pendingAcc.map((b) => [
                itemName(b.inventoryItemId),
                b.lotNumber ?? "—",
                b.expiryDate ?? "—",
                b.quantityAvailable,
              ])}
            />
          )}
        </Section>

        <Section
          title="Quarantined / rejected batches"
          count={quarantined.length}
          tone="destructive"
          link={{ to: "/quarantined-stock", label: "Open quarantined stock" }}
        >
          {quarantined.length > 0 && (
            <SimpleTable
              headers={["Item", "Lot", "Status", "Qty"]}
              rows={quarantined.map((b) => [
                itemName(b.inventoryItemId),
                b.lotNumber ?? "—",
                b.batchStatus,
                b.quantityAvailable,
              ])}
            />
          )}
        </Section>

        <Section
          title="Open supply requests"
          count={openSupply.length}
          tone="info"
          link={{ to: "/supply-status", label: "Open supply status" }}
        >
          {openSupply.length > 0 && (
            <SimpleTable
              headers={["Item", "Status", "Criticality"]}
              rows={openSupply.map((r) => [
                r.itemDescription ?? r.id,
                r.supplyStatus,
                <StatusBadge key="c" label={r.criticality} tone={toneForCriticality(r.criticality)} />,
              ])}
            />
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  tone,
  link,
  children,
}: {
  title: string;
  count: number;
  tone: "destructive" | "warning" | "info" | "success" | "default";
  link?: { to: string; label: string };
  children?: React.ReactNode;
}) {
  if (count === 0) return null;
  const accent =
    tone === "destructive" ? "border-l-destructive"
    : tone === "warning" ? "border-l-warning"
    : tone === "info" ? "border-l-info"
    : tone === "success" ? "border-l-success"
    : "border-l-primary";
  return (
    <section className={`bg-card border border-border border-l-4 ${accent} rounded-md`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">
          {title} <span className="text-muted-foreground tabular-nums">({count})</span>
        </h2>
        {link && (
          <Link to={link.to} className="text-xs font-medium text-primary hover:underline">
            {link.label} →
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (React.ReactNode | string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td key={j} className="p-2 tabular-nums">{cell as React.ReactNode}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
