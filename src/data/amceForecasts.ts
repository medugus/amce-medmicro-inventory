import type { SectionForecast, PurchaseRequest } from "@/types";

const today = new Date().toISOString().slice(0, 10);

// Sensible starter forecasts based on typical AMCE Medical Microbiology
// consumption. Bench heads can edit these in Section Forecasting.
export const AMCE_FORECASTS: SectionForecast[] = [
  // Blood culture
  { id: "FC-001", laboratorySection: "blood-culture", responsiblePerson: "George", itemName: "BACT/ALERT FA Plus aerobic bottles", category: "Blood culture consumables", currentStock: 120, averageMonthlyUsage: 180, quantityNeededForThreeMonths: 540, requestedQuantity: 420, justification: "Maintain 3-month buffer for adult sepsis workup; rising request volume from ICU.", priority: "High", estimatedCost: null, comments: "Order in full cartons of 100.", forecastDate: today },
  { id: "FC-002", laboratorySection: "blood-culture", responsiblePerson: "George", itemName: "BACT/ALERT FN Plus anaerobic bottles", category: "Blood culture consumables", currentStock: 90, averageMonthlyUsage: 150, quantityNeededForThreeMonths: 450, requestedQuantity: 360, justification: "Paired with aerobic bottles for adult sets.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-003", laboratorySection: "blood-culture", responsiblePerson: "George", itemName: "BACT/ALERT PF Plus paediatric bottles", category: "Blood culture consumables", currentStock: 40, averageMonthlyUsage: 60, quantityNeededForThreeMonths: 180, requestedQuantity: 140, justification: "Paediatric and neonatal sepsis workup.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Urine culture
  { id: "FC-010", laboratorySection: "urine-culture", responsiblePerson: "Chidi", itemName: "CLED agar plates (90 mm)", category: "Culture media", currentStock: 250, averageMonthlyUsage: 400, quantityNeededForThreeMonths: 1200, requestedQuantity: 950, justification: "Primary urine culture medium.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-011", laboratorySection: "urine-culture", responsiblePerson: "Chidi", itemName: "Calibrated 1 µL inoculating loops", category: "Consumables", currentStock: 800, averageMonthlyUsage: 1200, quantityNeededForThreeMonths: 3600, requestedQuantity: 3000, justification: "Quantitative urine culture.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // General culture
  { id: "FC-020", laboratorySection: "general-culture", responsiblePerson: "Juwairiya", itemName: "Blood agar plates (sheep blood)", category: "Culture media", currentStock: 300, averageMonthlyUsage: 600, quantityNeededForThreeMonths: 1800, requestedQuantity: 1500, justification: "Routine bacteriology workhorse medium.", priority: "Critical", estimatedCost: null, comments: "Confirm sheep blood supply with media prep.", forecastDate: today },
  { id: "FC-021", laboratorySection: "general-culture", responsiblePerson: "Juwairiya", itemName: "MacConkey agar plates", category: "Culture media", currentStock: 280, averageMonthlyUsage: 500, quantityNeededForThreeMonths: 1500, requestedQuantity: 1220, justification: "Selective medium for Gram-negatives.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-022", laboratorySection: "general-culture", responsiblePerson: "Juwairiya", itemName: "Chocolate agar plates", category: "Culture media", currentStock: 150, averageMonthlyUsage: 300, quantityNeededForThreeMonths: 900, requestedQuantity: 750, justification: "Fastidious organisms (Haemophilus, Neisseria).", priority: "High", estimatedCost: null, comments: "", forecastDate: today },

  // Sensitivity
  { id: "FC-030", laboratorySection: "sensitivity", responsiblePerson: "George", itemName: "Mueller-Hinton agar plates", category: "Culture media", currentStock: 200, averageMonthlyUsage: 450, quantityNeededForThreeMonths: 1350, requestedQuantity: 1150, justification: "Disk diffusion AST – CLSI standard.", priority: "Critical", estimatedCost: null, comments: "Verify depth/QC monthly.", forecastDate: today },
  { id: "FC-031", laboratorySection: "sensitivity", responsiblePerson: "George", itemName: "Antibiotic disks – assorted Gram-negative panel", category: "AST disks", currentStock: 25, averageMonthlyUsage: 40, quantityNeededForThreeMonths: 120, requestedQuantity: 100, justification: "Cartridges of meropenem, ceftriaxone, ciprofloxacin, etc.", priority: "High", estimatedCost: null, comments: "Cartridge = 50 disks.", forecastDate: today },
  { id: "FC-032", laboratorySection: "sensitivity", responsiblePerson: "George", itemName: "0.5 McFarland standards", category: "QC reagents", currentStock: 6, averageMonthlyUsage: 2, quantityNeededForThreeMonths: 6, requestedQuantity: 6, justification: "Inoculum standardisation.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // TB / MGIT
  { id: "FC-040", laboratorySection: "tb-mgit", responsiblePerson: "Chidi", itemName: "MGIT 960 culture tubes", category: "TB consumables", currentStock: 80, averageMonthlyUsage: 120, quantityNeededForThreeMonths: 360, requestedQuantity: 290, justification: "Liquid TB culture.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-041", laboratorySection: "tb-mgit", responsiblePerson: "Chidi", itemName: "MGIT PANTA / growth supplement kits", category: "TB consumables", currentStock: 4, averageMonthlyUsage: 6, quantityNeededForThreeMonths: 18, requestedQuantity: 14, justification: "Required additive for every MGIT tube.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-042", laboratorySection: "tb-mgit", responsiblePerson: "Chidi", itemName: "NALC-NaOH decontamination kit", category: "TB consumables", currentStock: 3, averageMonthlyUsage: 4, quantityNeededForThreeMonths: 12, requestedQuantity: 9, justification: "Sputum digestion/decontamination.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Gram stain
  { id: "FC-050", laboratorySection: "gram-stain", responsiblePerson: "Abubakar", itemName: "Gram stain kit (crystal violet, iodine, decolouriser, safranin)", category: "Stains", currentStock: 5, averageMonthlyUsage: 4, quantityNeededForThreeMonths: 12, requestedQuantity: 8, justification: "Routine Gram staining – all benches.", priority: "High", estimatedCost: null, comments: "1 L sets.", forecastDate: today },
  { id: "FC-051", laboratorySection: "gram-stain", responsiblePerson: "Abubakar", itemName: "Frosted glass slides (76 × 26 mm)", category: "Consumables", currentStock: 1500, averageMonthlyUsage: 2500, quantityNeededForThreeMonths: 7500, requestedQuantity: 6000, justification: "Slides for Gram, ZN and wet preps.", priority: "Medium", estimatedCost: null, comments: "Box of 50.", forecastDate: today },

  // Serology
  { id: "FC-060", laboratorySection: "serology", responsiblePerson: "Felicita", itemName: "HIV rapid test kits (Determine)", category: "Serology kits", currentStock: 120, averageMonthlyUsage: 200, quantityNeededForThreeMonths: 600, requestedQuantity: 480, justification: "Routine serology screening.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-061", laboratorySection: "serology", responsiblePerson: "Felicita", itemName: "Syphilis (RPR) test kit", category: "Serology kits", currentStock: 4, averageMonthlyUsage: 3, quantityNeededForThreeMonths: 9, requestedQuantity: 6, justification: "RPR screening.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Molecular / GeneXpert
  { id: "FC-070", laboratorySection: "molecular", responsiblePerson: "Chidi", itemName: "Xpert MTB/RIF Ultra cartridges", category: "Molecular cartridges", currentStock: 60, averageMonthlyUsage: 100, quantityNeededForThreeMonths: 300, requestedQuantity: 240, justification: "TB diagnosis and rifampicin resistance.", priority: "Critical", estimatedCost: null, comments: "Cold-chain (2–28 °C).", forecastDate: today },
  { id: "FC-071", laboratorySection: "molecular", responsiblePerson: "Chidi", itemName: "Xpert Carba-R cartridges", category: "Molecular cartridges", currentStock: 20, averageMonthlyUsage: 30, quantityNeededForThreeMonths: 90, requestedQuantity: 70, justification: "Carbapenemase detection for IPC.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },

  // MALDI-TOF
  { id: "FC-080", laboratorySection: "maldi-tof", responsiblePerson: "Felicita", itemName: "HCCA matrix (MALDI)", category: "MALDI consumables", currentStock: 2, averageMonthlyUsage: 1, quantityNeededForThreeMonths: 3, requestedQuantity: 2, justification: "Matrix for organism ID.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-081", laboratorySection: "maldi-tof", responsiblePerson: "Felicita", itemName: "MALDI target plates (disposable)", category: "MALDI consumables", currentStock: 50, averageMonthlyUsage: 80, quantityNeededForThreeMonths: 240, requestedQuantity: 200, justification: "Daily ID throughput.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Media prep
  { id: "FC-090", laboratorySection: "media-prep", responsiblePerson: "Abubakar", itemName: "Dehydrated Mueller-Hinton agar (500 g)", category: "Dehydrated media", currentStock: 4, averageMonthlyUsage: 6, quantityNeededForThreeMonths: 18, requestedQuantity: 14, justification: "In-house MHA pour plates.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-091", laboratorySection: "media-prep", responsiblePerson: "Abubakar", itemName: "Defibrinated sheep blood (100 mL)", category: "Media supplements", currentStock: 8, averageMonthlyUsage: 15, quantityNeededForThreeMonths: 45, requestedQuantity: 37, justification: "Blood agar enrichment.", priority: "High", estimatedCost: null, comments: "Cold-chain.", forecastDate: today },

  // Isolate storage
  { id: "FC-100", laboratorySection: "isolate-storage", responsiblePerson: "Abubakar", itemName: "Cryovials with beads (Microbank)", category: "Storage consumables", currentStock: 200, averageMonthlyUsage: 150, quantityNeededForThreeMonths: 450, requestedQuantity: 300, justification: "Long-term isolate banking.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Mycology
  { id: "FC-110", laboratorySection: "mycology", responsiblePerson: "Aretina", itemName: "Sabouraud dextrose agar plates", category: "Culture media", currentStock: 80, averageMonthlyUsage: 120, quantityNeededForThreeMonths: 360, requestedQuantity: 290, justification: "Fungal culture primary medium.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-111", laboratorySection: "mycology", responsiblePerson: "Aretina", itemName: "Cryptococcal antigen lateral flow assay", category: "Mycology kits", currentStock: 25, averageMonthlyUsage: 40, quantityNeededForThreeMonths: 120, requestedQuantity: 100, justification: "CrAg testing for HIV-positive patients.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },

  // Parasitology
  { id: "FC-120", laboratorySection: "parasitology", responsiblePerson: "Chidi", itemName: "Malaria RDT kits (P. falciparum/Pan)", category: "Parasitology kits", currentStock: 200, averageMonthlyUsage: 350, quantityNeededForThreeMonths: 1050, requestedQuantity: 850, justification: "Routine malaria screening.", priority: "Critical", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-121", laboratorySection: "parasitology", responsiblePerson: "Chidi", itemName: "Giemsa stain (1 L)", category: "Stains", currentStock: 3, averageMonthlyUsage: 2, quantityNeededForThreeMonths: 6, requestedQuantity: 4, justification: "Thick/thin film malaria microscopy.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // IPC / surveillance
  { id: "FC-130", laboratorySection: "ipc", responsiblePerson: "Emediong", itemName: "CHROMagar mSuperCARBA plates", category: "Selective media", currentStock: 60, averageMonthlyUsage: 100, quantityNeededForThreeMonths: 300, requestedQuantity: 240, justification: "CRE rectal screening for ICU.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-131", laboratorySection: "ipc", responsiblePerson: "Emediong", itemName: "Sterile flocked swabs (eSwab)", category: "Sampling", currentStock: 300, averageMonthlyUsage: 500, quantityNeededForThreeMonths: 1500, requestedQuantity: 1200, justification: "Rectal/nasal screening swabs.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },

  // Water surveillance
  { id: "FC-140", laboratorySection: "water", responsiblePerson: "Aretina", itemName: "Membrane filters 0.45 µm (47 mm)", category: "Water testing", currentStock: 200, averageMonthlyUsage: 150, quantityNeededForThreeMonths: 450, requestedQuantity: 300, justification: "Membrane filtration for coliform counts.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-141", laboratorySection: "water", responsiblePerson: "Aretina", itemName: "m-Endo broth ampoules", category: "Water testing", currentStock: 100, averageMonthlyUsage: 80, quantityNeededForThreeMonths: 240, requestedQuantity: 160, justification: "Coliform recovery medium.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },

  // Stores
  { id: "FC-150", laboratorySection: "stores", responsiblePerson: "Felicita", itemName: "Nitrile examination gloves (M)", category: "PPE", currentStock: 40, averageMonthlyUsage: 80, quantityNeededForThreeMonths: 240, requestedQuantity: 200, justification: "Universal PPE across all benches.", priority: "Critical", estimatedCost: null, comments: "Box of 100.", forecastDate: today },
  { id: "FC-151", laboratorySection: "stores", responsiblePerson: "Felicita", itemName: "Sterile specimen containers (60 mL)", category: "Sampling", currentStock: 600, averageMonthlyUsage: 1000, quantityNeededForThreeMonths: 3000, requestedQuantity: 2400, justification: "Urine/sputum collection.", priority: "High", estimatedCost: null, comments: "", forecastDate: today },
  { id: "FC-152", laboratorySection: "stores", responsiblePerson: "Felicita", itemName: "70% isopropyl alcohol (5 L)", category: "Disinfectants", currentStock: 6, averageMonthlyUsage: 8, quantityNeededForThreeMonths: 24, requestedQuantity: 18, justification: "Bench and equipment disinfection.", priority: "Medium", estimatedCost: null, comments: "", forecastDate: today },
];

export const AMCE_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "PR-001",
    requestDate: "2026-05-15",
    requestingSection: "parasitology",
    requestedBy: "Chidi",
    itemName: "Cary-Blair transport swab",
    quantityRequested: 4,
    quantityPerUnit: 20,
    unitsRequired: 2,
    justification: "Required for parasitology specimen processing, concentration, staining or microscopy workflow. Not yet received. Added to procurement tracker as approved request awaiting supply.",
    urgency: "High",
    currentStock: 0,
    averageMonthlyUsage: 2,
    preferredManufacturer: "Copan Transystem™",
    alternateManufacturer: "BD CultureSwab™",
    approvalStatus: "Approved",
    approvedBy: "Procurement",
    procurementStatus: "Delivery pending",
    dateSupplied: null,
  },
];
