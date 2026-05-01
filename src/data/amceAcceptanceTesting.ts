import type { AcceptanceTest } from "@/types";

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const AMCE_ACCEPTANCE_TESTS: AcceptanceTest[] = [
  { id: "at-001", batchId: "b-003", itemName: "Mueller-Hinton agar plates", lotNumber: "LOT-MHA-44510", dateReceived: addDays(-3), expiryDate: addDays(45), storageConditionOnReceipt: "Refrigerated, 2-8 °C", physicalCondition: "Acceptable", certificateOfAnalysisAvailable: true, qcPerformed: false, qcResult: "Pending", acceptedOrRejected: "Pending", acceptedBy: null, dateAccepted: null, correctiveActionIfRejected: "", comments: "QC organism verification scheduled." },
  { id: "at-002", batchId: "b-011", itemName: "MacConkey agar plates", lotNumber: "LOT-MAC-44600", dateReceived: addDays(-2), expiryDate: addDays(60), storageConditionOnReceipt: "Refrigerated, 2-8 °C", physicalCondition: "Acceptable", certificateOfAnalysisAvailable: false, qcPerformed: false, qcResult: "Pending", acceptedOrRejected: "Rejected", acceptedBy: "Dr Medugu", dateAccepted: addDays(-2), correctiveActionIfRejected: "Quarantined; supplier notified to provide certificate of analysis.", comments: "Hold until COA received." },
  { id: "at-003", batchId: "b-005", itemName: "Cefoxitin 30 mcg discs", lotNumber: "LOT-CFX-9001", dateReceived: addDays(-40), expiryDate: addDays(120), storageConditionOnReceipt: "Refrigerated, 2-8 °C", physicalCondition: "Acceptable", certificateOfAnalysisAvailable: true, qcPerformed: true, qcResult: "Pass", acceptedOrRejected: "Accepted", acceptedBy: "Juwairiya", dateAccepted: addDays(-38), correctiveActionIfRejected: "", comments: "QC against S. aureus ATCC 25923 within range." },
];
