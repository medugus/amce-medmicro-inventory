import type { LaboratorySection, LaboratorySectionId } from "@/types";

export const AMCE_SECTIONS: LaboratorySection[] = [
  { id: "blood-culture", name: "Blood culture bench", leads: ["George"], description: "Aerobic, anaerobic and paediatric blood culture workflows.", active: true },
  { id: "urine-culture", name: "Urine culture bench", leads: ["Chidi"], description: "Urine culture and uropathogen screening.", active: true },
  { id: "general-culture", name: "General culture bench", leads: ["George"], description: "Routine bacteriology and isolate work-up.", active: true },
  { id: "gram-stain", name: "Gram stain bench", leads: ["Abubakar"], description: "Gram staining and microscopy reagents.", active: true },
  { id: "serology", name: "Serology and immunology", leads: ["Felicita"], description: "Serology, immunoassays, calibrators and controls.", active: true },
  { id: "molecular", name: "Molecular / GeneXpert", leads: ["Chidi"], description: "GeneXpert cartridges and molecular consumables.", active: true },
  { id: "maldi-tof", name: "MALDI-TOF", leads: ["Felicita"], description: "MALDI-TOF identification consumables.", active: true },
  { id: "media-prep", name: "Media preparation", leads: ["Abubakar"], description: "In-house media preparation and QC.", active: true },
  { id: "isolate-storage", name: "Isolate storage", leads: ["Abubakar"], description: "Cryopreservation and isolate banking.", active: true },
  { id: "mycology", name: "Mycology", leads: ["Aretina"], description: "Fungal culture, microscopy and antigen testing.", active: true },
  { id: "parasitology", name: "Parasitology", leads: ["Echici"], description: "Malaria RDT, microscopy and stool parasitology.", active: true },
  { id: "ipc", name: "IPC / environmental surveillance", leads: ["Emediong"], description: "CRE/MRSA screening and environmental sampling.", active: true },
  { id: "water", name: "Water microbiology surveillance", leads: ["Aretina"], description: "Membrane filtration and water quality monitoring.", active: true },
  { id: "stores", name: "General laboratory stores", leads: ["Felicita"], description: "Central stores receipt, issue and storage.", active: true },
];

export const SECTION_NAME: Record<LaboratorySectionId, string> = AMCE_SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.name }),
  {} as Record<LaboratorySectionId, string>
);
