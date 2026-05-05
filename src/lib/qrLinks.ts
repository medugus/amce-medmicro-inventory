// Helpers to build/parse QR links for scannable lab assets.

export type QrEntityType = "batch" | "equipment" | "durable" | "item";

export function buildQrUrl(type: QrEntityType, id: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/r/${type}/${encodeURIComponent(id)}`;
}

export function targetRouteFor(type: QrEntityType): string {
  switch (type) {
    case "batch": return "/batch-register";
    case "equipment": return "/equipment-register";
    case "durable": return "/durables-register";
    case "item": return "/inventory-master";
  }
}
