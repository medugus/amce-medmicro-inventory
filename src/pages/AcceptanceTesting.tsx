import { useMemo, useState } from "react";
import { useAcceptanceTests, useBatches, useInventory } from "@/lib/useLiveData";
import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { recordAcceptance } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { toast } from "sonner";
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
  const tests = useAcceptanceTests();
  const batches = useBatches();
  const inventory = useInventory();
  const itemsById = useMemo(() => Object.fromEntries(inventory.map((i) => [i.id, i])), [inventory]);

  const pendingBatches = useMemo(
    () => batches.filter((b) => b.acceptanceStatus === "Pending acceptance" || b.batchStatus === "Pending acceptance"),
    [batches]
  );

  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Rejected">("Accepted");
  const [qcResult, setQcResult] = useState<"Pass" | "Fail" | "Pending" | "Not required">("Pass");
  const [coa, setCoa] = useState(true);
  const [physical, setPhysical] = useState<"Acceptable" | "Damaged" | "Compromised" | "Pending review">("Acceptable");
  const [comments, setComments] = useState("");
  const [corrective, setCorrective] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setBatchId(""); setDecision("Accepted"); setQcResult("Pass"); setCoa(true);
    setPhysical("Acceptable"); setComments(""); setCorrective("");
  }

  async function handleSave() {
    const user = getCurrentUser();
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!batchId) { toast.error("Select a batch."); return; }
    if (decision === "Rejected" && !corrective.trim()) { toast.error("Corrective action is required when rejecting."); return; }
    setSubmitting(true);
    try {
      await recordAcceptance({
        batchId, decision, qcResult,
        certificateOfAnalysisAvailable: coa,
        physicalCondition: physical,
        comments, correctiveActionIfRejected: corrective,
      });
      toast.success(`Batch ${decision.toLowerCase()} by ${user.name}.`);
      reset(); setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSubmitting(false); }
  }

  const groups: Record<GroupKey, AcceptanceTest[]> = {
    "Pending acceptance": [],
    Accepted: [],
    Rejected: [],
    "Requires corrective action": [],
  };
  for (const t of tests) groups[classify(t)].push(t);

  return (
    <div>
      <Header
        title="Acceptance Testing"
        description="Receipt checks and QC for critical reagents, kits, cartridges, media, stains, discs and QC materials. Items cannot be issued until accepted."
        actions={
          <div className="flex items-center gap-2">
            <ExportButton />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm">Record acceptance</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Record acceptance decision</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Batch awaiting acceptance</Label>
                    <Select value={batchId} onValueChange={setBatchId}>
                      <SelectTrigger><SelectValue placeholder={pendingBatches.length ? "Select batch" : "No pending batches"} /></SelectTrigger>
                      <SelectContent>
                        {pendingBatches.map((b) => {
                          const item = itemsById[b.inventoryItemId];
                          return (
                            <SelectItem key={b.id} value={b.id}>
                              {item?.itemName ?? b.inventoryItemId} — {b.batchNumber} — recv {b.dateReceived}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Decision</Label>
                      <Select value={decision} onValueChange={(v) => setDecision(v as "Accepted" | "Rejected")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">QC result</Label>
                      <Select value={qcResult} onValueChange={(v) => setQcResult(v as typeof qcResult)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Pass", "Fail", "Pending", "Not required"] as const).map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Physical condition</Label>
                      <Select value={physical} onValueChange={(v) => setPhysical(v as typeof physical)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Acceptable", "Damaged", "Compromised", "Pending review"] as const).map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="flex items-end gap-2 text-xs pb-2">
                      <Checkbox checked={coa} onCheckedChange={(v) => setCoa(Boolean(v))} />
                      Certificate of Analysis available
                    </label>
                  </div>
                  <div>
                    <Label className="text-xs">Comments</Label>
                    <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
                  </div>
                  {decision === "Rejected" && (
                    <div>
                      <Label className="text-xs">Corrective action (required)</Label>
                      <Textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Recorded by: <span className="font-medium text-foreground">{getCurrentUser()?.name ?? "no user selected"}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving…" : "Save decision"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
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
