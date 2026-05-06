// Zod schemas for action-boundary validation.
//
// These guard the surface between forms and Dexie writes so silent type drift
// (e.g. a string "5" sneaking into a number field) becomes a clear error.

import { z } from "zod";

const movementType = z.enum([
  "Issue",
  "Receive",
  "Return",
  "Adjust",
  "Transfer",
  "Discard",
  "Quarantine",
  "Release from quarantine",
]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .nullable();

export const recordMovementSchema = z.object({
  movementType,
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  batchId: z.string().min(1, "Batch is required"),
  quantity: z.number().finite(),
  fromSection: z.string().nullable(),
  toSection: z.string().nullable(),
  reason: z.string(),
  authorisedBy: z.string().nullable(),
  referenceNumber: z.string().nullable(),
  notes: z.string(),
});

export const createBatchSchema = z.object({
  inventoryItemId: z.string().min(1, "Select an inventory item"),
  batchNumber: z.string().trim().min(1, "Batch / lot number is required"),
  lotNumber: z.string().nullable(),
  quantityReceived: z.number().positive("Quantity received must be greater than zero"),
  expiryDate: isoDate,
  dateReceived: z.string().min(1, "Date received is required"),
  storageLocation: z.string(),
  storageConditionRequired: z.string(),
  notes: z.string(),
});
