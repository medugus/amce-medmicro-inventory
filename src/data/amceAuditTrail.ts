import type { AuditTrailEntry } from "@/types";

// Audit trail will be populated when backend integration enables persistent
// logging of user actions. Until then, this register is intentionally empty.
export const AMCE_AUDIT_TRAIL: AuditTrailEntry[] = [];
