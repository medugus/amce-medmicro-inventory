import type { SupplyStatusRecord } from "@/types";

export interface DataQualityFlag {
  field: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export function supplyStatusFlags(r: SupplyStatusRecord): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (r.requestedQuantity === null) flags.push({ field: "requestedQuantity", message: "Quantity not documented", severity: "warning" });
  if (!r.supplier && (r.supplyStatus === "Ordered" || r.supplyStatus === "Supplied" || r.supplyStatus === "Partially supplied")) {
    flags.push({ field: "supplier", message: "Supplier not documented", severity: "warning" });
  }
  if (r.supplyStatus === "Supplied" && r.suppliedQuantity === null) {
    flags.push({ field: "suppliedQuantity", message: "Supplied quantity not documented", severity: "warning" });
  }
  if (r.supplyStatus === "Partially supplied" && (r.outstandingQuantity === null || r.outstandingQuantity <= 0)) {
    flags.push({ field: "outstandingQuantity", message: "Outstanding quantity not reconciled", severity: "warning" });
  }
  return flags;
}

export function actionRequired(r: SupplyStatusRecord): string {
  if (r.requestedQuantity === null) return "Confirm quantity with bench head";
  if (!r.supplier && r.supplyStatus !== "Requested" && r.supplyStatus !== "Pending procurement") return "Confirm supplier or procurement source";
  if (r.supplyStatus === "Pending procurement") return "Follow up with procurement";
  if (r.supplyStatus === "Partially supplied") return "Review outstanding balance";
  if (r.supplyStatus === "Supplied") return "Complete receipt and acceptance documentation";
  if (r.supplyStatus === "Not supplied" && r.criticality === "Critical") return "Escalate for urgent procurement review";
  if (r.supplyStatus === "Delayed") return "Follow up with supplier on revised delivery";
  if (r.supplyStatus === "Requires clarification") return "Section head to clarify request";
  return "Monitor";
}

export function supplyRiskScore(r: SupplyStatusRecord): number {
  let s = 0;
  if (r.criticality === "Critical") s += 4;
  else if (r.criticality === "High") s += 2;
  else if (r.criticality === "Medium") s += 1;
  if (r.supplyStatus === "Not supplied" || r.supplyStatus === "Pending procurement") s += 3;
  if (r.supplyStatus === "Delayed") s += 2;
  if (r.supplyStatus === "Partially supplied") s += 1;
  if (supplyStatusFlags(r).length > 0) s += 1;
  return s;
}

export function isCriticalRisk(r: SupplyStatusRecord): boolean {
  return supplyRiskScore(r) >= 6;
}
