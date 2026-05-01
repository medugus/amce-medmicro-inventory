import type { EquipmentAsset, DurableAsset, MaintenanceRecord, CalibrationRecord, LaboratorySectionId } from "@/types";

// Equipment register seeded from the lab's equipment list (S/N 1-100).
// Items already marked as "durable" in the source list are seeded into
// AMCE_DURABLES below, NOT into the equipment register. No serial numbers,
// asset numbers, calibration dates, or model numbers have been invented —
// those fields stay blank for staff to fill in from the physical asset.
type SeedEquipment = {
  slug: string;
  name: string;
  category: string;
  section: LaboratorySectionId;
  notes: string;
  calibrationRequired?: boolean;
  maintenanceRequired?: boolean;
};

const EQ_SEED: SeedEquipment[] = [
  { slug: "bact-alert-system", name: "BACT/ALERT blood culture system", category: "Blood culture equipment", section: "blood-culture", notes: "Record model, serial number, module capacity, service contract, maintenance schedule.", maintenanceRequired: true },
  { slug: "bc-loading-workstation", name: "Blood culture loading/scanning workstation", category: "Blood culture equipment", section: "blood-culture", notes: "Include barcode scanner/computer if dedicated." },
  { slug: "genexpert-instrument", name: "GeneXpert instrument", category: "Molecular equipment", section: "molecular", notes: "Record number of modules, module status, calibration due date.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "genexpert-workstation", name: "GeneXpert computer/workstation", category: "Molecular equipment", section: "molecular", notes: "Track as IT-linked laboratory equipment." },
  { slug: "mgit-960", name: "MGIT 960 / MGIT system", category: "TB/mycobacteriology equipment", section: "tb-mgit", notes: "If planned/available; needs service and contamination monitoring.", maintenanceRequired: true },
  { slug: "bsc-ii-1", name: "Class II biosafety cabinet", category: "Biosafety equipment", section: "general-culture", notes: "Critical asset; record certification date and next certification due.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "bsc-ii-2", name: "Additional Class II biosafety cabinet", category: "Biosafety equipment", section: "tb-mgit", notes: "Include each cabinet separately (TB / mycology / high-risk work).", calibrationRequired: true, maintenanceRequired: true },
  { slug: "bsc-mediaprep", name: "Biological safety cabinet (media/prep area)", category: "Biosafety equipment", section: "media-prep", notes: "If used in media preparation / culture setup.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "autoclave", name: "Autoclave (bench or floor model)", category: "Sterilisation equipment", section: "media-prep", notes: "Record validation, service, and temperature/pressure checks.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "dry-heat-oven", name: "Dry heat oven / hot air oven", category: "Sterilisation equipment", section: "media-prep", notes: "For glassware/drying if used.", maintenanceRequired: true },
  { slug: "incubator-37", name: "Incubator, 35–37 °C", category: "Incubation equipment", section: "general-culture", notes: "Multiple incubators should be separate records.", maintenanceRequired: true },
  { slug: "co2-incubator", name: "CO₂ incubator", category: "Incubation equipment", section: "general-culture", notes: "For chocolate agar / fastidious organisms. Record CO₂ monitoring and maintenance.", maintenanceRequired: true },
  { slug: "anaerobic-workstation", name: "Anaerobic jar system / anaerobic workstation", category: "Culture equipment", section: "general-culture", notes: "If only jars are used, jars are durables; workstation is equipment." },
  { slug: "microaerophilic-system", name: "Microaerophilic jar/system", category: "Culture equipment", section: "general-culture", notes: "For Campylobacter / fastidious organisms, if used." },
  { slug: "fridge-2-8", name: "Refrigerator, 2–8 °C", category: "Cold-chain equipment", section: "stores", notes: "Reagents, discs, kits. Each refrigerator should have a unique asset record." },
  { slug: "freezer-20", name: "Freezer, −20 °C", category: "Cold-chain equipment", section: "isolate-storage", notes: "Reagents, isolate storage. Record temperature monitoring." },
  { slug: "freezer-80", name: "Freezer, −80 °C", category: "Cold-chain equipment", section: "isolate-storage", notes: "Critical for long-term isolate / molecular archive storage." },
  { slug: "temp-monitor-device", name: "Refrigerator/freezer temperature monitoring device", category: "Cold-chain equipment", section: "stores", notes: "Each logger can be tracked as equipment.", calibrationRequired: true },
  { slug: "temp-data-logger", name: "Temperature data logger", category: "Cold-chain equipment", section: "stores", notes: "Refrigerators / freezers / incubators. Include serial number and calibration date.", calibrationRequired: true },
  { slug: "digital-thermometer", name: "Digital / probe thermometer", category: "Monitoring equipment", section: "stores", notes: "Cold chain, incubators, water bath. Requires calibration / verification.", calibrationRequired: true },
  { slug: "maldi-tof", name: "MALDI-TOF mass spectrometer", category: "MALDI-TOF equipment", section: "maldi-tof", notes: "Major asset; track service contract, calibration, downtime.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "maldi-workstation", name: "MALDI-TOF computer/workstation", category: "MALDI-TOF equipment", section: "maldi-tof", notes: "Include software / license status if needed." },
  { slug: "maldi-ups", name: "MALDI-TOF UPS", category: "Power support equipment", section: "maldi-tof", notes: "Track battery / service status.", maintenanceRequired: true },
  { slug: "autolumo", name: "AutoLumo / chemiluminescence immunoassay analyser", category: "Serology equipment", section: "serology", notes: "If used; track maintenance / calibration.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "serology-rapid-reader", name: "Serology rapid-test reader", category: "Serology equipment", section: "serology", notes: "If used." },
  { slug: "elisa-reader", name: "ELISA reader", category: "Serology equipment", section: "serology", notes: "If ELISA testing is done.", calibrationRequired: true },
  { slug: "elisa-washer", name: "ELISA washer", category: "Serology equipment", section: "serology", notes: "If ELISA testing is done.", maintenanceRequired: true },
  { slug: "plate-shaker-incubator", name: "Plate shaker/incubator", category: "Serology equipment", section: "serology", notes: "If applicable." },
  { slug: "binocular-microscope", name: "Binocular light microscope", category: "Microscopy equipment", section: "gram-stain", notes: "Gram stain, parasitology, mycology. Each microscope should be separately registered." },
  { slug: "fluorescence-microscope", name: "Fluorescence microscope", category: "Microscopy equipment", section: "mycology", notes: "For auramine / calcofluor (mycology / TB / parasitology), if available." },
  { slug: "microscope-camera", name: "Digital microscope camera system", category: "Microscopy equipment", section: "gram-stain", notes: "Teaching / reporting, if used." },
  { slug: "centrifuge-benchtop", name: "Centrifuge, bench-top", category: "General laboratory equipment", section: "molecular", notes: "Molecular, serology, sample prep. Record rotor type, speed, maintenance.", maintenanceRequired: true },
  { slug: "centrifuge-refrigerated", name: "Refrigerated centrifuge", category: "General laboratory equipment", section: "molecular", notes: "If available.", maintenanceRequired: true },
  { slug: "microcentrifuge", name: "Microcentrifuge", category: "Molecular equipment", section: "molecular", notes: "Molecular / GeneXpert support, if used." },
  { slug: "vortex-mixer", name: "Vortex mixer", category: "General laboratory equipment", section: "molecular", notes: "Molecular, serology, bacteriology." },
  { slug: "heat-block", name: "Heat block / dry bath", category: "General laboratory equipment", section: "molecular", notes: "Molecular, serology. Record temperature verification.", calibrationRequired: true },
  { slug: "water-bath", name: "Water bath", category: "General laboratory equipment", section: "serology", notes: "Serology, reagent prep. Record temperature verification.", calibrationRequired: true },
  { slug: "analytical-balance", name: "Analytical balance", category: "General laboratory equipment", section: "media-prep", notes: "Media preparation. Requires calibration.", calibrationRequired: true },
  { slug: "top-loading-balance", name: "Top-loading balance", category: "General laboratory equipment", section: "media-prep", notes: "Media preparation. Requires verification.", calibrationRequired: true },
  { slug: "ph-meter", name: "pH meter", category: "General laboratory equipment", section: "media-prep", notes: "Media preparation, water testing. Requires calibration with buffers.", calibrationRequired: true },
  { slug: "magnetic-stirrer", name: "Magnetic stirrer / hot plate", category: "General laboratory equipment", section: "media-prep", notes: "Media preparation. Track function and safety." },
  { slug: "media-dispenser", name: "Media dispenser", category: "General laboratory equipment", section: "media-prep", notes: "If available." },
  { slug: "plate-pouring-machine", name: "Plate pouring machine", category: "General laboratory equipment", section: "media-prep", notes: "If available.", maintenanceRequired: true },
  { slug: "colony-counter", name: "Colony counter", category: "Culture equipment", section: "general-culture", notes: "Culture bench, water testing, if available." },
  { slug: "mcfarland-densitometer", name: "McFarland densitometer", category: "General laboratory equipment", section: "sensitivity", notes: "Critical for AST standardisation.", calibrationRequired: true },
  { slug: "disc-dispenser", name: "Disc dispenser", category: "General laboratory equipment", section: "sensitivity", notes: "If reusable, can be durable; if calibrated/maintained, register here." },
  { slug: "zone-reader", name: "Zone reader / automated inhibition-zone reader", category: "General laboratory equipment", section: "sensitivity", notes: "If available.", calibrationRequired: true },
  { slug: "sensititre-vitek-system", name: "Sensititre / VITEK / Phoenix / MicroScan system", category: "General laboratory equipment", section: "sensitivity", notes: "Include only if present or planned.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "vitek-2", name: "VITEK 2 instrument", category: "General laboratory equipment", section: "sensitivity", notes: "If used.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "vitek-densichek", name: "VITEK DensiCHEK", category: "General laboratory equipment", section: "sensitivity", notes: "If VITEK used.", calibrationRequired: true },
  { slug: "nephelometer", name: "Nephelometer / turbidity meter", category: "General laboratory equipment", section: "sensitivity", notes: "If separate from densitometer.", calibrationRequired: true },
  { slug: "urised-analyser", name: "UriSed urine analyser", category: "General laboratory equipment", section: "urine-culture", notes: "Urine culture / urinalysis, if present.", maintenanceRequired: true },
  { slug: "urine-strip-reader", name: "Urine strip reader", category: "General laboratory equipment", section: "urine-culture", notes: "If used." },
  { slug: "biosafety-centrifuge-rotors", name: "Biosafety centrifuge buckets / sealed rotors", category: "Biosafety equipment", section: "molecular", notes: "Sample processing. Can be durable or equipment depending on tracking policy." },
  { slug: "specimen-barcode-scanner", name: "Specimen reception barcode scanner", category: "IT and barcode equipment", section: "stores", notes: "Preanalytical area. Track if lab-owned." },
  { slug: "label-printer", name: "Label printer", category: "IT and barcode equipment", section: "stores", notes: "Reception, culture, isolate storage. Track printer model / serial." },
  { slug: "lab-workstation", name: "Laboratory computer/workstation", category: "IT and barcode equipment", section: "stores", notes: "Each bench. Include dedicated lab systems." },
  { slug: "network-printer", name: "Network printer", category: "IT and barcode equipment", section: "stores", notes: "Laboratory reporting, if lab-owned." },
  { slug: "ups-critical", name: "UPS for critical analysers", category: "Power support equipment", section: "stores", notes: "MALDI, GeneXpert, BACT/ALERT, AutoLumo. Track each UPS separately.", maintenanceRequired: true },
  { slug: "voltage-stabiliser", name: "Voltage stabiliser / AVR", category: "Power support equipment", section: "stores", notes: "Critical analysers, if used." },
  { slug: "water-filtration-manifold", name: "Water filtration manifold", category: "Water surveillance equipment", section: "water", notes: "3-place or 6-place manifold." },
  { slug: "vacuum-pump", name: "Vacuum pump for membrane filtration", category: "Water surveillance equipment", section: "water", notes: "Record service status.", maintenanceRequired: true },
  { slug: "water-incubator", name: "Incubator for water microbiology", category: "Water surveillance equipment", section: "water", notes: "Separate from routine culture if dedicated.", maintenanceRequired: true },
  { slug: "conductivity-meter", name: "Conductivity / TDS meter", category: "Water surveillance equipment", section: "water", notes: "If microbiology monitors water quality jointly.", calibrationRequired: true },
  { slug: "portable-ph-conductivity", name: "Portable pH / conductivity meter", category: "Water surveillance equipment", section: "water", notes: "If used.", calibrationRequired: true },
  { slug: "atp-luminometer", name: "ATP luminometer", category: "IPC screening consumables", section: "ipc", notes: "If ATP monitoring is used.", calibrationRequired: true },
  { slug: "air-sampler", name: "Air sampler", category: "General laboratory equipment", section: "ipc", notes: "For theatre / high-risk unit air sampling, if used.", calibrationRequired: true, maintenanceRequired: true },
  { slug: "fridge-media", name: "Refrigerator for media storage", category: "Cold-chain equipment", section: "media-prep", notes: "Separate from reagent fridge if present." },
  { slug: "fridge-serology", name: "Refrigerator for serology kits", category: "Cold-chain equipment", section: "serology", notes: "Separate asset." },
  { slug: "freezer-isolate-archive", name: "Freezer for isolate archive", category: "Cold-chain equipment", section: "isolate-storage", notes: "May be −20 °C or −80 °C." },
  { slug: "cryostorage-scanner", name: "Cryostorage inventory scanner / barcode reader", category: "IT and barcode equipment", section: "isolate-storage", notes: "If used." },
  { slug: "lab-timer-set", name: "Laboratory timer set", category: "General laboratory equipment", section: "general-culture", notes: "Multiple benches. Usually durable unless electronically tracked." },
  { slug: "pipette-calibration-set", name: "Pipette calibration / checking device", category: "General laboratory equipment", section: "stores", notes: "Quality / technical support, if available.", calibrationRequired: true },
  { slug: "bunsen-burner", name: "Bunsen burner / microincinerator", category: "General laboratory equipment", section: "general-culture", notes: "Culture bench, if used." },
  { slug: "slide-warmer", name: "Slide warmer", category: "Microscopy equipment", section: "gram-stain", notes: "Gram stain / mycology / parasitology, if available." },
  { slug: "fume-hood", name: "Fume hood / chemical safety cabinet", category: "Biosafety equipment", section: "general-culture", notes: "Stains, chemicals, mycology, if present.", maintenanceRequired: true },
  { slug: "flammable-cabinet", name: "Flammable chemical cabinet", category: "Biosafety equipment", section: "maldi-tof", notes: "For acetonitrile / formic acid (MALDI solvents, stains), if applicable." },
  { slug: "eyewash-station", name: "Emergency eyewash station", category: "Biosafety equipment", section: "stores", notes: "Track inspection / maintenance.", maintenanceRequired: true },
  { slug: "safety-shower", name: "Safety shower", category: "Biosafety equipment", section: "stores", notes: "If present.", maintenanceRequired: true },
  { slug: "cold-box-with-logger", name: "Cold box with temperature logger", category: "Cold-chain equipment", section: "stores", notes: "Sample transport. Track logger calibration.", calibrationRequired: true },
];

// Equipment seeded from the equipment list. IDs are stable so re-seeding never
// duplicates rows. All previously-blank fields are now filled with clearly
// marked DUMMY values so the register demonstrates the full schema. Staff
// must overwrite these with real values from each physical asset.
const SECTION_OFFICER: Record<LaboratorySectionId, string> = {
  "blood-culture": "George (DUMMY)",
  "urine-culture": "Chidi (DUMMY)",
  "general-culture": "Juwairiya (DUMMY)",
  "sensitivity": "George (DUMMY)",
  "tb-mgit": "Chidi (DUMMY)",
  "gram-stain": "Abubakar (DUMMY)",
  "serology": "Felicita (DUMMY)",
  "molecular": "Chidi (DUMMY)",
  "maldi-tof": "Felicita (DUMMY)",
  "media-prep": "Abubakar (DUMMY)",
  "isolate-storage": "Abubakar (DUMMY)",
  "mycology": "Aretina (DUMMY)",
  "parasitology": "Chidi (DUMMY)",
  "ipc": "Emediong (DUMMY)",
  "water": "Aretina (DUMMY)",
  "stores": "Felicita (DUMMY)",
};

function pad(n: number, width = 3): string {
  return n.toString().padStart(width, "0");
}

export const AMCE_EQUIPMENT: EquipmentAsset[] = EQ_SEED.map((e, idx) => {
  const seq = pad(idx + 1);
  return {
    id: `eq-seed-${e.slug}`,
    equipmentName: e.name,
    equipmentCategory: e.category,
    manufacturer: "DUMMY Manufacturer Ltd",
    model: `DUMMY-MOD-${seq}`,
    serialNumber: `DUMMY-SN-${seq}`,
    assetNumber: `AMCE-EQ-${seq}`,
    laboratorySection: e.section,
    location: `Microbiology lab — ${e.section.replace(/-/g, " ")} (DUMMY)`,
    responsibleOfficer: SECTION_OFFICER[e.section],
    installationDate: "2023-01-15",
    warrantyStatus: "Active until 2026-01-14 (DUMMY)",
    serviceContractStatus: "Active (DUMMY)",
    operationalStatus: "Operational",
    calibrationRequired: e.calibrationRequired ?? false,
    calibrationFrequency: e.calibrationRequired ? "Annual (DUMMY)" : null,
    lastCalibrationDate: e.calibrationRequired ? "2025-08-01" : null,
    nextCalibrationDueDate: e.calibrationRequired ? "2026-08-01" : null,
    maintenanceRequired: e.maintenanceRequired ?? false,
    lastMaintenanceDate: e.maintenanceRequired ? "2025-09-15" : null,
    nextMaintenanceDueDate: e.maintenanceRequired ? "2026-03-15" : null,
    notes: `${e.notes} [DUMMY DATA — replace with values from the physical asset.]`,
  };
});

// Durables seeded from the lab's "Durables" spreadsheet (2025-07-30 stocktake)
// plus durable items identified in the equipment list (S/N 68, 75–78, 81–82,
// 85, 89–100). IDs are stable so re-seeding never duplicates rows on a lab PC.
type SeedDurable = {
  slug: string;
  assetName: string;
  assetCategory: string;
  quantity: number;
  laboratorySection?: LaboratorySectionId;
  notes?: string;
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

// All previously-blank fields are now filled with clearly marked DUMMY values
// so the register demonstrates the full schema. Staff must overwrite these
// with real values from the physical asset.
const DURABLE_CONDITIONS: Array<DurableAsset["condition"]> = ["Good", "Good", "Good", "Fair"];

export const AMCE_DURABLES: DurableAsset[] = SEED.map((s, idx) => {
  const section: LaboratorySectionId = s.laboratorySection ?? "stores";
  return {
    id: `dur-seed-${s.slug}`,
    assetName: s.assetName,
    assetCategory: s.assetCategory,
    laboratorySection: section,
    location: `Media prep shelf ${String.fromCharCode(65 + (idx % 6))}${(idx % 4) + 1} (DUMMY)`,
    quantity: s.quantity,
    condition: DURABLE_CONDITIONS[idx % DURABLE_CONDITIONS.length],
    responsibleOfficer: SECTION_OFFICER[section],
    purchaseDate: "2025-07-30",
    expectedReplacementDate: "2028-07-30",
    notes: `${s.notes ?? ""} [DUMMY DATA — replace with real values.]`.trim(),
  };
});

export const AMCE_MAINTENANCE: MaintenanceRecord[] = [];

export const AMCE_CALIBRATION: CalibrationRecord[] = [];
