import { describe, it, expect } from "vitest";
import { supplyStatusFlags, actionRequired, supplyRiskScore, isCriticalRisk } from "./supplyStatus";
import type { SupplyStatusRecord } from "@/types";

const rec = (over: Partial<SupplyStatusRecord> = {}): SupplyStatusRecord => ({
  id: "s1",
  itemName: "Blood culture bottles",
  category: "Consumable",
  laboratorySection: "blood-culture",
  responsiblePerson: "Lead",
  requestedQuantity: 100,
  suppliedQuantity: null,
  outstandingQuantity: null,
  unitOfIssue: "box",
  supplyStatus: "Requested",
  procurementStatus: "Not started",
  supplier: "Acme",
  dateRequested: "2026-01-01",
  dateOrdered: null,
  dateSupplied: null,
  remarks: "",
  criticality: "High",
  ...over,
});

describe("supplyStatusFlags", () => {
  it("flags missing requested quantity", () => {
    const f = supplyStatusFlags(rec({ requestedQuantity: null }));
    expect(f.find((x) => x.field === "requestedQuantity")).toBeTruthy();
  });
  it("flags missing supplier when ordered", () => {
    const f = supplyStatusFlags(rec({ supplier: null, supplyStatus: "Ordered" }));
    expect(f.find((x) => x.field === "supplier")).toBeTruthy();
  });
  it("does not flag missing supplier when only requested", () => {
    const f = supplyStatusFlags(rec({ supplier: null, supplyStatus: "Requested" }));
    expect(f.find((x) => x.field === "supplier")).toBeFalsy();
  });
  it("flags missing supplied qty when supplied", () => {
    const f = supplyStatusFlags(rec({ supplyStatus: "Supplied", suppliedQuantity: null }));
    expect(f.find((x) => x.field === "suppliedQuantity")).toBeTruthy();
  });
  it("flags unreconciled outstanding when partially supplied", () => {
    const f = supplyStatusFlags(rec({ supplyStatus: "Partially supplied", outstandingQuantity: 0 }));
    expect(f.find((x) => x.field === "outstandingQuantity")).toBeTruthy();
  });
  it("clean record yields no flags", () => {
    expect(supplyStatusFlags(rec({ supplyStatus: "Supplied", suppliedQuantity: 100 }))).toEqual([]);
  });
});

describe("actionRequired", () => {
  it("asks to confirm quantity when missing", () => {
    expect(actionRequired(rec({ requestedQuantity: null }))).toMatch(/quantity/i);
  });
  it("asks to follow up procurement when pending", () => {
    expect(actionRequired(rec({ supplyStatus: "Pending procurement" }))).toMatch(/procurement/i);
  });
  it("escalates Critical not-supplied", () => {
    expect(
      actionRequired(rec({ supplyStatus: "Not supplied", criticality: "Critical" }))
    ).toMatch(/escalate/i);
  });
  it("falls back to Monitor", () => {
    expect(actionRequired(rec({ supplyStatus: "Ordered" }))).toBe("Monitor");
  });
});

describe("supplyRiskScore + isCriticalRisk", () => {
  it("scales with criticality and status", () => {
    const low = supplyRiskScore(rec({ criticality: "Low", supplyStatus: "Ordered" }));
    const high = supplyRiskScore(rec({ criticality: "Critical", supplyStatus: "Pending procurement" }));
    expect(high).toBeGreaterThan(low);
  });
  it("flags critical risk above threshold", () => {
    expect(
      isCriticalRisk(rec({ criticality: "Critical", supplyStatus: "Not supplied" }))
    ).toBe(true);
  });
  it("low-criticality ordered request is not critical risk", () => {
    expect(isCriticalRisk(rec({ criticality: "Low", supplyStatus: "Ordered" }))).toBe(false);
  });
});
