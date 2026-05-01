import type { AMCEUser } from "@/types";

export const AMCE_USERS: AMCEUser[] = [
  { id: "u-medugu", name: "Dr Medugu", role: "Consultant/Director", title: "Quality system and consultant oversight", sections: [], active: true },
  { id: "u-imran", name: "Dr Imran", role: "Consultant/Director", title: "Preanalytical and analytical procedure oversight", sections: [], active: true },
  { id: "u-george", name: "George", role: "Section Head", title: "Blood culture bench lead", sections: ["blood-culture"], active: true },
  { id: "u-juwairiya", name: "Juwairiya", role: "Section Head", title: "General culture bench lead", sections: ["general-culture"], active: true },
  { id: "u-chidi", name: "Chidi", role: "Section Head", title: "Urine culture, Molecular/GeneXpert and Parasitology bench lead", sections: ["urine-culture", "molecular", "parasitology"], active: true },
  { id: "u-abubakar", name: "Abubakar", role: "Section Head", title: "Gram stain, media prep and isolate storage lead", sections: ["gram-stain", "media-prep", "isolate-storage"], active: true },
  { id: "u-felicita", name: "Felicita", role: "Section Head", title: "Serology, MALDI-TOF and stores lead", sections: ["serology", "maldi-tof", "stores"], active: true },
  { id: "u-aretina", name: "Aretina", role: "Section Head", title: "Mycology and water surveillance lead", sections: ["mycology", "water"], active: true },
  { id: "u-emediong", name: "Emediong", role: "Section Head", title: "IPC and environmental surveillance lead", sections: ["ipc"], active: true },
];
