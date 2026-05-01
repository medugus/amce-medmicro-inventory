import type { EquipmentAsset, DurableAsset, MaintenanceRecord, CalibrationRecord } from "@/types";

// Equipment register intentionally empty in seed: real equipment data must be imported.
// Do not fabricate serial numbers, asset numbers, or calibration dates.
export const AMCE_EQUIPMENT: EquipmentAsset[] = [];

// Durables seeded from the lab's "Durables" spreadsheet (2025-07-30 stocktake).
// IDs are stable so re-seeding never duplicates rows on a lab PC.
type SeedDurable = {
  slug: string;
  assetName: string;
  assetCategory: string;
  quantity: number;
};

const SEED: SeedDurable[] = [
  { slug: "conical-flask-2l", assetName: "Conical Flask 2 litres", assetCategory: "Glassware", quantity: 1 },
  { slug: "conical-flask-1l", assetName: "Conical Flask 1 litre", assetCategory: "Glassware", quantity: 2 },
  { slug: "conical-flask-250ml", assetName: "Conical Flask 250ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "conical-flask-100ml", assetName: "Conical Flask 100ml", assetCategory: "Glassware", quantity: 4 },
  { slug: "beaker-2l", assetName: "Beaker 2 litres", assetCategory: "Glassware", quantity: 2 },
  { slug: "beaker-1l", assetName: "Beaker 1 litre", assetCategory: "Glassware", quantity: 2 },
  { slug: "beaker-500ml", assetName: "Beaker 500ml", assetCategory: "Glassware", quantity: 4 },
  { slug: "beaker-250ml", assetName: "Beaker 250ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "beaker-100ml", assetName: "Beaker 100ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-2l", assetName: "Measuring cylinder 2 litres", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-1l", assetName: "Measuring cylinder 1 litre", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-500ml", assetName: "Measuring cylinder 500ml", assetCategory: "Glassware", quantity: 1 },
  { slug: "measuring-cyl-250ml", assetName: "Measuring cylinder 250ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-100ml", assetName: "Measuring cylinder 100ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-50ml", assetName: "Measuring cylinder 50ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "measuring-cyl-25ml", assetName: "Measuring cylinder 25ml", assetCategory: "Glassware", quantity: 2 },
  { slug: "glass-funnel-60mm", assetName: "Glass funnel 60mm", assetCategory: "Glassware", quantity: 1 },
  { slug: "glass-funnel-75mm", assetName: "Glass funnel 75mm", assetCategory: "Glassware", quantity: 6 },
  { slug: "glass-funnel-100mm", assetName: "Glass funnel 100mm", assetCategory: "Glassware", quantity: 6 },
  { slug: "amber-bottle-1l", assetName: "Amber reagent bottle 1 litre", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "amber-bottle-500ml", assetName: "Amber reagent bottle 500ml", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "amber-bottle-250ml", assetName: "Amber reagent bottle 250ml", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "clear-bottle-2l", assetName: "Clear reagent bottle 2 litres", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "clear-bottle-1l", assetName: "Clear reagent bottle 1 litre", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "clear-bottle-250ml", assetName: "Clear reagent bottle 250ml", assetCategory: "Reagent bottle", quantity: 2 },
  { slug: "koplin-jar", assetName: "Koplin Jar", assetCategory: "Staining ware", quantity: 1 },
  { slug: "concavity-slide", assetName: "Concavity slide", assetCategory: "Slides", quantity: 2 },
];

// Only fields present in the Durables sheet are populated. Location, condition,
// responsible officer, and replacement dates are left blank for staff to fill in
// — we will not invent values that are not in the source spreadsheet.
export const AMCE_DURABLES: DurableAsset[] = SEED.map((s) => ({
  id: `dur-seed-${s.slug}`,
  assetName: s.assetName,
  assetCategory: s.assetCategory,
  laboratorySection: "stores",
  location: null,
  quantity: s.quantity,
  condition: "Not documented",
  responsibleOfficer: null,
  purchaseDate: "2025-07-30",
  expectedReplacementDate: null,
  notes: "",
}));

export const AMCE_MAINTENANCE: MaintenanceRecord[] = [];

export const AMCE_CALIBRATION: CalibrationRecord[] = [];
