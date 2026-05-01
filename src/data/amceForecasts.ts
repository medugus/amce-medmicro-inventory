import type { SectionForecast, PurchaseRequest } from "@/types";

const today = new Date().toISOString().slice(0, 10);

export const AMCE_FORECASTS: SectionForecast[] = [
  { id: "fc-001", laboratorySection: "blood-culture", responsiblePerson: "George", itemName: "Adult aerobic blood culture bottles", category: "Blood culture bottles and accessories", currentStock: 62, averageMonthlyUsage: 90, quantityNeededForThreeMonths: 270, requestedQuantity: 250, justification: "Sustained increase in sepsis admissions.", priority: "Critical", estimatedCost: null, comments: "", forecastDate: today },
  { id: "fc-002", laboratorySection: "molecular", responsiblePerson: "Chidi", itemName: "Xpert MTB/RIF Ultra cartridges", category: "GeneXpert cartridges and accessories", currentStock: 0, averageMonthlyUsage: 40, quantityNeededForThreeMonths: 120, requestedQuantity: 120, justification: "Required for TB programme continuity.", priority: "Critical", estimatedCost: null, comments: "", forecastDate: today },
  { id: "fc-003", laboratorySection: "ipc", responsiblePerson: "Emediong", itemName: "CHROMagar CRE plates", category: "CRE/CPE screening materials", currentStock: 0, averageMonthlyUsage: 60, quantityNeededForThreeMonths: 180, requestedQuantity: 200, justification: "Active CRE surveillance ongoing in ICU.", priority: "Critical", estimatedCost: null, comments: "", forecastDate: today },
  { id: "fc-004", laboratorySection: "mycology", responsiblePerson: "Aretina", itemName: "Cryptococcal antigen lateral flow kits", category: "Mycology reagents and media", currentStock: 0, averageMonthlyUsage: 2, quantityNeededForThreeMonths: 6, requestedQuantity: 6, justification: "HIV-positive cohort screening.", priority: "Critical", estimatedCost: null, comments: "", forecastDate: today },
];

export const AMCE_PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: "pr-001", requestDate: today, requestingSection: "molecular", requestedBy: "Chidi", itemName: "Xpert MTB/RIF Ultra cartridges", quantityRequested: 100, justification: "Stock-out risk for TB diagnostics.", urgency: "Critical", currentStock: 0, averageMonthlyUsage: 40, supplierPreference: "Cepheid distributor", estimatedCost: null, approvalStatus: "Submitted", approvedBy: null, procurementStatus: "Awaiting quotation", dateSupplied: null },
  { id: "pr-002", requestDate: today, requestingSection: "ipc", requestedBy: "Emediong", itemName: "CHROMagar CRE plates", quantityRequested: 200, justification: "ICU CRE surveillance.", urgency: "Critical", currentStock: 0, averageMonthlyUsage: 60, supplierPreference: "CHROMagar", estimatedCost: null, approvalStatus: "Under review", approvedBy: null, procurementStatus: "Awaiting approval", dateSupplied: null },
  { id: "pr-003", requestDate: today, requestingSection: "mycology", requestedBy: "Aretina", itemName: "Cryptococcal antigen lateral flow kits", quantityRequested: 5, justification: "HIV cohort screening.", urgency: "Critical", currentStock: 0, averageMonthlyUsage: 2, supplierPreference: null, estimatedCost: null, approvalStatus: "Draft", approvedBy: null, procurementStatus: "Not started", dateSupplied: null },
];
