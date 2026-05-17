// AMCE Microbiology Inventory & Supply Management — Domain Types

export type LaboratorySectionId =
  | "blood-culture"
  | "urine-culture"
  | "general-culture"
  | "sensitivity"
  | "tb-mgit"
  | "gram-stain"
  | "serology"
  | "molecular"
  | "maldi-tof"
  | "media-prep"
  | "isolate-storage"
  | "mycology"
  | "parasitology"
  | "ipc"
  | "water"
  | "stores";

export interface LaboratorySection {
  id: LaboratorySectionId;
  name: string;
  leads: string[];
  description: string;
  active: boolean;
}

export type UserRole =
  | "Administrator"
  | "Laboratory Manager"
  | "Consultant/Director"
  | "Consultant"
  | "Specialist"
  | "Quality Manager"
  | "Section Head"
  | "Procurement Officer"
  | "Stores Officer"
  | "Read-only User";

export interface AMCEUser {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  sections: LaboratorySectionId[];
  active: boolean;
}

export type Criticality = "Critical" | "High" | "Medium" | "Low";

export type SupplyStatus =
  | "Requested"
  | "Pending procurement"
  | "Under review"
  | "Ordered"
  | "Partially supplied"
  | "Supplied"
  | "Not supplied"
  | "Delayed"
  | "Cancelled"
  | "Requires clarification";

export type ProcurementStatus =
  | "Not started"
  | "Awaiting quotation"
  | "Quotation received"
  | "Awaiting approval"
  | "Approved"
  | "Ordered"
  | "Delivery pending"
  | "Delivered"
  | "Partially delivered"
  | "Delayed"
  | "Rejected"
  | "Closed"
  | "Requires procurement update";

export interface SupplyStatusRecord {
  id: string;
  itemName: string;
  category: string;
  laboratorySection: LaboratorySectionId;
  responsiblePerson: string;
  requestedQuantity: number | null;
  suppliedQuantity: number | null;
  outstandingQuantity: number | null;
  unitOfIssue: string;
  supplyStatus: SupplyStatus;
  procurementStatus: ProcurementStatus;
  supplier: string | null;
  dateRequested: string | null;
  dateOrdered: string | null;
  dateSupplied: string | null;
  remarks: string;
  criticality: Criticality;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  laboratorySection: LaboratorySectionId;
  unitOfIssue: string;
  manufacturer: string | null;
  supplier: string | null;
  catalogueNumber: string | null;
  reorderLevel: number;
  minimumStock: number;
  maximumStock: number;
  storageCondition: string;
  criticality: Criticality;
  active: boolean;
  notes: string;
}

export type AcceptanceStatus =
  | "Pending acceptance"
  | "Accepted"
  | "Rejected"
  | "Quarantined"
  | "Not required";

export type BatchStatus =
  | "Pending acceptance"
  | "Accepted"
  | "Quarantined"
  | "Rejected"
  | "Expired"
  | "Consumed"
  | "Discarded";

export interface InventoryBatch {
  id: string;
  inventoryItemId: string;
  batchNumber: string;
  lotNumber: string | null;
  quantityReceived: number;
  quantityAvailable: number;
  expiryDate: string | null;
  dateReceived: string;
  storageLocation: string;
  storageConditionRequired: string;
  acceptanceStatus: AcceptanceStatus;
  batchStatus: BatchStatus;
  certificateOfAnalysisAvailable: boolean;
  qcRequired: boolean;
  qcResult: "Pass" | "Fail" | "Pending" | "Not required";
  acceptedBy: string | null;
  dateAccepted: string | null;
  quarantineReason: string | null;
  notes: string;
}

export type MovementType =
  | "Receive"
  | "Issue"
  | "Transfer"
  | "Adjust"
  | "Discard"
  | "Return"
  | "Quarantine"
  | "Release from quarantine";

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  batchId: string;
  movementType: MovementType;
  quantity: number;
  fromSection: LaboratorySectionId | null;
  toSection: LaboratorySectionId | null;
  dateTime: string;
  performedBy: string;
  authorisedBy: string | null;
  reason: string;
  referenceNumber: string | null;
  notes: string;
}

export interface AcceptanceTest {
  id: string;
  batchId: string;
  itemName: string;
  lotNumber: string | null;
  dateReceived: string;
  expiryDate: string | null;
  storageConditionOnReceipt: string;
  physicalCondition: "Acceptable" | "Damaged" | "Compromised" | "Pending review";
  certificateOfAnalysisAvailable: boolean;
  qcPerformed: boolean;
  qcResult: "Pass" | "Fail" | "Pending" | "Not required";
  acceptedOrRejected: "Accepted" | "Rejected" | "Pending";
  acceptedBy: string | null;
  dateAccepted: string | null;
  correctiveActionIfRejected: string;
  comments: string;
}

export type EquipmentOperationalStatus =
  | "Operational"
  | "Under maintenance"
  | "Out of service"
  | "Awaiting repair"
  | "Decommissioned"
  | "Pending installation"
  | "Not documented";

export interface EquipmentAsset {
  id: string;
  equipmentName: string;
  equipmentCategory: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  assetNumber: string | null;
  laboratorySection: LaboratorySectionId;
  location: string | null;
  responsibleOfficer: string | null;
  installationDate: string | null;
  warrantyStatus: string;
  serviceContractStatus: string;
  operationalStatus: EquipmentOperationalStatus;
  calibrationRequired: boolean;
  calibrationFrequency: string | null;
  lastCalibrationDate: string | null;
  nextCalibrationDueDate: string | null;
  maintenanceRequired: boolean;
  lastMaintenanceDate: string | null;
  nextMaintenanceDueDate: string | null;
  notes: string;
}

export interface DurableAsset {
  id: string;
  assetName: string;
  assetCategory: string;
  laboratorySection: LaboratorySectionId;
  location: string | null;
  quantity: number | null;
  condition: "Good" | "Fair" | "Poor" | "Not documented";
  responsibleOfficer: string | null;
  purchaseDate: string | null;
  expectedReplacementDate: string | null;
  notes: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  maintenanceType: "Preventive" | "Corrective" | "Verification" | "Inspection";
  datePerformed: string;
  performedBy: string;
  vendor: string | null;
  findings: string;
  actionTaken: string;
  downtimeHours: number;
  nextDueDate: string | null;
  documentReference: string | null;
  status: "Completed" | "In progress" | "Pending" | "Overdue";
}

export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  calibratedBy: string;
  result: "Pass" | "Fail" | "Conditional pass";
  certificateReference: string | null;
  nextDueDate: string | null;
  status: "Valid" | "Expired" | "Pending";
  comments: string;
}

export interface SectionForecast {
  id: string;
  laboratorySection: LaboratorySectionId;
  responsiblePerson: string;
  itemName: string;
  category: string;
  currentStock: number;
  averageMonthlyUsage: number;
  quantityNeededForThreeMonths: number;
  requestedQuantity: number;
  justification: string;
  priority: Criticality;
  estimatedCost: number | null;
  comments: string;
  forecastDate: string;
}

export interface AuditTrailEntry {
  id: string;
  user: string;
  dateTime: string;
  action: string;
  module: string;
  entityId: string;
  previousValue: string | null;
  newValue: string | null;
  reason: string;
  notes: string;
}

export type PurchaseRequestStatus =
  | "Draft"
  | "Submitted"
  | "Under review"
  | "Approved"
  | "Rejected"
  | "Ordered"
  | "Partially supplied"
  | "Supplied"
  | "Closed";

export type GtinCategory =
  | "culture media"
  | "reagent"
  | "consumable"
  | "PPE"
  | "equipment"
  | "other";

export interface GtinCatalogueEntry {
  gtin: string;
  productName: string;
  manufacturer: string | null;
  unit: string | null;
  category: GtinCategory | null;
  inventoryItemId: string | null; // optional link to InventoryItem
  createdAt: string;
  lastSeenAt: string;
}

export interface ScanHistoryEntry {
  id: string;
  scannedAt: string;
  scannedBy: string;
  gtin: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  productName: string | null;
  rawCode: string;
  action: string;
}

export interface PurchaseRequest {
  id: string;
  requestDate: string;
  requestingSection: LaboratorySectionId;
  requestedBy: string;
  itemName: string;
  quantityPerUnit: number;
  unitsRequired: number;
  justification: string;
  urgency: Criticality;
  currentStock: number;
  averageMonthlyUsage: number;
  supplierPreference: string | null;
  estimatedCost: number | null;
  approvalStatus: PurchaseRequestStatus;
  approvedBy: string | null;
  procurementStatus: ProcurementStatus;
  dateSupplied: string | null;
}
