// Centralized SOP / how-to-use content for each module.
// Used by HelpButton (in page Header) and EmptyStateTip.

export interface HelpEntry {
  title: string;
  purpose: string;
  steps: string[];
  warnings?: string[];
  emptyTip?: string; // shown on empty pages instead of the generic message
}

export const HELP: Record<string, HelpEntry> = {
  dashboard: {
    title: "Dashboard",
    purpose: "Live operational view across supply, inventory, quality and asset readiness.",
    steps: [
      "Scan Critical actions first — these are items that need attention today.",
      "Use Operational summaries to see overall counts.",
      "Click 'View critical actions' to drill into specific issues.",
    ],
  },
  inventoryMaster: {
    title: "Inventory Master",
    purpose: "The catalogue of every reagent, consumable and supply item the lab uses.",
    steps: [
      "Add a new item here BEFORE you can receive batches or record movements for it.",
      "Each item needs a unique code, name, category, unit, and section.",
      "Set reorder level so the system can flag low stock automatically.",
    ],
    warnings: [
      "Don't create duplicate items — search first. Duplicates split your stock counts.",
    ],
    emptyTip: "Start by adding your reagents, consumables and supplies. Each item here becomes available in Batch Register and Stock Movements.",
  },
  batchRegister: {
    title: "Batch / Lot Register",
    purpose: "Every physical batch received from a supplier, with lot number, expiry and quantity.",
    steps: [
      "Receive a new batch when stock physically arrives in the lab.",
      "Always enter the lot number and expiry exactly as printed on the package.",
      "New batches go into 'Pending acceptance' until QC clears them.",
    ],
    warnings: [
      "If the item isn't in Inventory Master yet, add it first — you can't receive a batch for an unknown item.",
      "A batch with no expiry date will not appear in FEFO / expiry alerts.",
    ],
    emptyTip: "No batches yet. Receive your first batch here once stock physically arrives. Make sure the item exists in Inventory Master first.",
  },
  stockMovements: {
    title: "Receive / Stock Movements",
    purpose: "Record every issue, return, transfer or adjustment of stock against a specific batch.",
    steps: [
      "Pick the inventory item, then the batch you are moving from.",
      "Enter quantity, movement type, and a reason.",
      "Use 'Receive new batch' shortcut if the batch you need isn't listed.",
    ],
    warnings: [
      "Only released batches appear here. Pending or quarantined batches must be cleared in Acceptance Testing first.",
      "Issuing more than the batch holds is blocked — split across batches if needed.",
    ],
    emptyTip: "No movements recorded yet. Movements need at least one released batch — receive and accept a batch first.",
  },
  acceptanceTesting: {
    title: "Acceptance Testing",
    purpose: "QC step that releases a received batch into usable stock, or sends it to quarantine.",
    steps: [
      "Review each pending batch's documents and physical condition.",
      "Mark Accepted to release it for use, or Rejected to quarantine it.",
      "Add the test reference / certificate number for audit.",
    ],
    warnings: [
      "Rejected batches are NOT deleted — they move to Quarantine and stay in the audit trail.",
    ],
    emptyTip: "Nothing to test right now. New batches received in Batch Register will appear here automatically.",
  },
  quarantinedStock: {
    title: "Quarantined Stock",
    purpose: "Batches that failed acceptance, are recalled, or are otherwise blocked from use.",
    steps: [
      "Review each quarantined batch and decide: dispose, return to supplier, or release.",
      "All decisions are logged with user + reason.",
    ],
  },
  expiryFEFO: {
    title: "Expiry (FEFO)",
    purpose: "First-Expire-First-Out view so the soonest-to-expire batches get used first.",
    steps: [
      "Issue from the batches at the top of the list before later-expiring ones.",
      "Anything red is already expired — move to Expired/Wasted Stock.",
    ],
  },
  expiredWasted: {
    title: "Expired / Wasted Stock",
    purpose: "Disposal record for stock that expired, was damaged, or was wasted.",
    steps: [
      "Log every disposal with quantity, reason and witness.",
      "This data feeds wastage reporting and forecasting accuracy.",
    ],
  },
  assets: {
    title: "Equipment & Durables",
    purpose: "Capital equipment (analysers, incubators) and durables (glassware, instruments).",
    steps: [
      "Register each asset with serial number, location and section.",
      "Set maintenance and calibration due dates so the dashboard can flag them.",
    ],
    emptyTip: "No equipment registered yet. Add each major instrument so calibration and maintenance can be tracked.",
  },
  supplyStatus: {
    title: "Supply Status",
    purpose: "Tracks open supply requests from sections to stores / procurement.",
    steps: [
      "Update status as items are sourced, partially supplied, or fulfilled.",
    ],
  },
  purchaseRequests: {
    title: "Purchase Requests",
    purpose: "Formal procurement requests raised to finance / supply chain.",
    steps: [
      "Raise a new request with item, quantity and justification.",
      "Track approval status until the PO is issued.",
    ],
  },
  procurementFollowup: {
    title: "Procurement Follow-up",
    purpose: "Chase-list for purchase requests that are approved but not yet delivered.",
    steps: [
      "Log every follow-up call/email with date and contact person.",
    ],
  },
  lowStockReorder: {
    title: "Low Stock & Reorder",
    purpose: "Items at or below their reorder level that need to be re-ordered.",
    steps: [
      "Raise a Purchase Request directly from this list.",
      "Reorder level is set on each item in Inventory Master.",
    ],
  },
  sectionForecasting: {
    title: "Section Forecasting",
    purpose: "Projected consumption per section based on usage history.",
    steps: [
      "Use these projections when planning quarterly procurement.",
    ],
  },
  dataQuality: {
    title: "Data Quality Review",
    purpose: "Finds records with missing critical fields (expiry, lot, supplier, etc.).",
    steps: [
      "Open each flagged record and fill the missing field.",
      "Clean data here keeps dashboards and audits accurate.",
    ],
  },
  readinessAudit: {
    title: "Readiness Audit",
    purpose: "Pre-inspection checklist showing whether the lab is audit-ready.",
    steps: [
      "Resolve every red item before an external inspection.",
    ],
  },
  auditTrail: {
    title: "Audit Trail",
    purpose: "Immutable log of every create / update / delete across the system.",
    steps: [
      "Filter by user, module, or date to investigate any change.",
    ],
  },
  reports: {
    title: "Reports",
    purpose: "Exportable summaries for management, finance and regulators.",
    steps: [
      "Pick a report, set the date range, and export to PDF or CSV.",
    ],
  },
  criticalActions: {
    title: "Critical Actions",
    purpose: "Single triage list of everything across the system that needs attention.",
    steps: [
      "Click any row to jump straight to the source record.",
    ],
  },
  settings: {
    title: "Settings",
    purpose: "User identity, app preferences, and data management.",
    steps: [
      "Set the active user before recording movements — this stamps the audit trail.",
    ],
  },
};
