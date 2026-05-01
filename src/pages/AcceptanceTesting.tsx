import { useState } from "react";
import { AMCE_ACCEPTANCE_TESTS } from "@/data/amceAcceptanceTesting";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AcceptanceTest } from "@/types";

type GroupKey = "Pending acceptance" | "Accepted" | "Rejected" | "Requires corrective action";

function classify(t: AcceptanceTest): GroupKey {
  if (t.acceptedOrRejected === "Pending") return "Pending acceptance";
  if (t.acceptedOrRejected === "Accepted") return "Accepted";
  if (t.acceptedOrRejected === "Rejected" && t.correctiveActionIfRejected) return "Requires corrective action";
  return "Rejected";
}

function TestTable({ rows }: { rows: AcceptanceTest[] }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="border border-border rounded-md overflow-x-auto bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-2">Item</th>
            <th className="p-2">Lot</th>
            <th className="p-2">Date received</th>
            <th className="p-2">Storage on receipt</th>
            <th className="p-2">COA</th>
            <th className="p-2">QC performed</th>
            <th className="p-2">QC result</th>
            <th className="p-2">Decision</th>
            <th className="p-2">Accepted by</th>
            <th className="p-2">Corrective action / comments</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border hover:bg-muted/30 align-top">
              <td className="p-2 font-medium">{t.itemName}</td>
              <td className="p-2 text-xs">{t.lotNumber ?? "Not documented"}</td>
              <td className="p-2 text-xs">{t.dateReceived}</td>
              <td className="p-2 text-xs">{t.storageConditionOnReceipt}</td>
              <td className="p-2 text-xs">{t.certificateOfAnalysisAvailable ? "Yes" : "No"}</td>
              <td className="p-2 text-xs">{t.qcPerformed ? "Yes" : "No"}</td>
              <td className="p-2 text-xs">{t.qcResult}</td>
              <td className="p-2">
                <StatusBadge
                  label={t.acceptedOrRejected}
                  tone={t.acceptedOrRejected === "Accepted" ? "success" : t.acceptedOrRejected === "Rejected" ? "destructive" : "info"}
                />
              </td>
              <td className="p-2 text-xs">{t.acceptedBy ?? "Pending assignment"}</td>
              <td className="p-2 text-xs max-w-sm">
                {t.comments}
                {t.correctiveActionIfRejected ? <div className="mt-1 text-warning-foreground">{t.correctiveActionIfRejected}</div> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AcceptanceTestingPage() {
  const [tab, setTab] = useState<GroupKey>("Pending acceptance");
  const groups: Record<GroupKey, AcceptanceTest[]> = {
    "Pending acceptance": [],
    Accepted: [],
    Rejected: [],
    "Requires corrective action": [],
  };
  for (const t of AMCE_ACCEPTANCE_TESTS) groups[classify(t)].push(t);

  return (
    <div>
      <Header
        title="Acceptance Testing"
        description="Receipt checks and QC for critical reagents, kits, cartridges, media, stains, discs and QC materials. Items cannot be issued until accepted."
        actions={<ExportButton />}
      />
      <div className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as GroupKey)}>
          <TabsList>
            {(Object.keys(groups) as GroupKey[]).map((k) => (
              <TabsTrigger key={k} value={k}>{k} <span className="ml-1 text-muted-foreground">({groups[k].length})</span></TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(groups) as GroupKey[]).map((k) => (
            <TabsContent key={k} value={k} className="mt-4">
              <TestTable rows={groups[k]} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
