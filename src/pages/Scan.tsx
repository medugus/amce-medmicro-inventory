import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScanLine, Camera, X, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useBatches, useDataReady, useEquipment, useDurables, useInventory, usePurchaseRequests } from "@/lib/useLiveData";
import type { QrEntityType } from "@/lib/qrLinks";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_DURABLES, AMCE_EQUIPMENT } from "@/data/amceAssets";
import { ReceiveBatchDialog } from "@/components/forms/ReceiveBatchDialog";
import { recordAcceptance } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";

type ScannerTarget =
  | { kind: "record"; type: QrEntityType; id: string }
  | { kind: "receive"; scannedCode: string; inventoryItemId?: string }
  | { kind: "purchaseRequests" };

const TYPE_ALIASES: Record<string, QrEntityType | "purchaseRequests"> = {
  batch: "batch",
  batches: "batch",
  lot: "batch",
  lots: "batch",
  b: "batch",
  item: "item",
  inventory: "item",
  inv: "item",
  sku: "item",
  equipment: "equipment",
  eq: "equipment",
  asset: "equipment",
  durable: "durable",
  durables: "durable",
  dur: "durable",
  pr: "purchaseRequests",
  purchase: "purchaseRequests",
  "purchase-request": "purchaseRequests",
  "purchase-requests": "purchaseRequests",
};

function cleanCodeValue(value: string): string {
  let text = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, "").trim();
  if (text.startsWith("]") && text.length > 3) text = text.slice(3).trim();
  try { text = decodeURIComponent(text); } catch { /* keep original */ }
  return text.replace(/^['"]+|['"]+$/g, "").trim();
}

function canonical(value: string): string {
  return cleanCodeValue(value).toLowerCase().replace(/[‐‑‒–—−]/g, "-").replace(/\s+/g, " ").trim();
}

function compact(value: string): string {
  return canonical(value).replace(/[^a-z0-9]/g, "");
}

function equalCode(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  return canonical(a) === canonical(b) || compact(a) === compact(b);
}

function addCandidate(set: Set<string>, value: unknown) {
  if (value == null) return;
  const text = cleanCodeValue(String(value));
  if (text) set.add(text);
}

function collectJsonStrings(value: unknown, set: Set<string>) {
  if (typeof value === "string" || typeof value === "number") addCandidate(set, value);
  else if (Array.isArray(value)) value.forEach((v) => collectJsonStrings(v, set));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectJsonStrings(v, set));
}

function candidatePayloads(raw: string): string[] {
  const set = new Set<string>();
  addCandidate(set, raw);
  const cleaned = cleanCodeValue(raw);

  try {
    const url = new URL(cleaned);
    addCandidate(set, url.pathname);
    addCandidate(set, url.hash.replace(/^#/, ""));
    url.pathname.split("/").forEach((part) => addCandidate(set, part));
    url.searchParams.forEach((value) => addCandidate(set, value));
  } catch { /* not a URL */ }

  if (/^[\[{]/.test(cleaned)) {
    try { collectJsonStrings(JSON.parse(cleaned), set); } catch { /* not JSON */ }
  }

  for (const match of cleaned.matchAll(/\((\d{2,4})\)([^()]+)/g)) addCandidate(set, match[2]);
  cleaned.split(/[\n\r\t|;,]+/).forEach((part) => {
    addCandidate(set, part);
    const keyValue = part.match(/^[\w -]{1,32}\s*[:=]\s*(.+)$/);
    if (keyValue) addCandidate(set, keyValue[1]);
  });

  return [...set];
}

function appLinkTarget(raw: string): ScannerTarget | null {
  for (const candidate of candidatePayloads(raw)) {
    let path = candidate;
    try { path = new URL(candidate).pathname; } catch { /* not a URL */ }
    const match = path.match(/\/?r\/([^/]+)\/(.+)$/i);
    if (!match) continue;
    const type = TYPE_ALIASES[canonical(match[1])];
    if (!type) continue;
    if (type === "purchaseRequests") return { kind: "purchaseRequests" };
    return { kind: "record", type, id: cleanCodeValue(match[2]) };
  }
  return null;
}

export function ScanPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState("");
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveItemId, setReceiveItemId] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptBatchId, setAcceptBatchId] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Rejected">("Accepted");
  const [qcResult, setQcResult] = useState<"Pass" | "Fail" | "Pending" | "Not required">("Pass");
  const [coa, setCoa] = useState(true);
  const [physical, setPhysical] = useState<"Acceptable" | "Damaged" | "Compromised" | "Pending review">("Acceptable");
  const [comments, setComments] = useState("");
  const [corrective, setCorrective] = useState("");
  const [accepting, setAccepting] = useState(false);

  const batches = useBatches();
  const items = useInventory();
  const equipment = useEquipment();
  const durables = useDurables();
  const purchaseRequests = usePurchaseRequests();
  const dataReady = useDataReady();
  const scanBatches = batches.length ? batches : AMCE_BATCHES;
  const scanItems = items.length ? items : AMCE_INVENTORY_MASTER;
  const scanEquipment = equipment.length ? equipment : AMCE_EQUIPMENT;
  const scanDurables = durables.length ? durables : AMCE_DURABLES;
  const acceptBatch = scanBatches.find((b) => b.id === acceptBatchId);
  const acceptItem = acceptBatch ? scanItems.find((i) => i.id === acceptBatch.inventoryItemId) : undefined;

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current.clear?.();
        scannerRef.current = null;
      }
    };
  }, []);

  function go(target: ScannerTarget) {
    stopScanner();
    if (target.kind === "purchaseRequests") {
      navigate({ to: "/purchase-requests" });
      return;
    }
    if (target.kind === "receive") {
      openReceipt(target.scannedCode, target.inventoryItemId ?? "");
      return;
    }
    navigate({ to: "/r/$type/$id", params: { type: target.type, id: target.id } });
  }

  function openReceipt(scannedCode = "", inventoryItemId = "") {
    stopScanner();
    setReceiveCode(scannedCode);
    setReceiveItemId(inventoryItemId);
    setReceiveOpen(true);
  }

  function fallbackLookup(raw: string): ScannerTarget | null {
    const candidates = candidatePayloads(raw);
    if (candidates.length === 0) return null;

    for (const code of candidates) {
      const typeId = code.match(/^([a-z][a-z -]{0,24})\s*[:/#|]\s*(.+)$/i);
      if (typeId) {
        const type = TYPE_ALIASES[canonical(typeId[1])];
        if (type === "purchaseRequests") return { kind: "purchaseRequests" };
        if (type) return { kind: "record", type, id: cleanCodeValue(typeId[2]) };
      }

      if (/^(pr|purchase request|purchase-request)\b/i.test(code)) return { kind: "purchaseRequests" };
      const batch = scanBatches.find((b) => equalCode(b.id, code) || equalCode(b.batchNumber, code) || equalCode(b.lotNumber, code));
      if (batch) return { kind: "record", type: "batch", id: batch.id };

      const item = scanItems.find((i) =>
        equalCode(i.id, code) ||
        equalCode(i.catalogueNumber, code) ||
        equalCode(i.itemName, code) ||
        (compact(code).length >= 4 && [i.catalogueNumber, i.manufacturer, i.supplier].some((v) => v && compact(v).includes(compact(code))))
      );
      if (item) {
        openReceipt(code, item.id);
        return { kind: "record", type: "item", id: item.id };
      }

      const eq = scanEquipment.find((e) =>
        equalCode(e.id, code) || equalCode(e.serialNumber, code) || equalCode(e.assetNumber, code) || equalCode(e.equipmentName, code)
      );
      if (eq) return { kind: "record", type: "equipment", id: eq.id };

      const durable = scanDurables.find((d) => equalCode(d.id, code) || equalCode(d.assetName, code));
      if (durable) return { kind: "record", type: "durable", id: durable.id };
    }

    const haystack = compact(candidates.join(" "));
    const item = haystack.length >= 6 ? scanItems.find((i) => compact(i.itemName).includes(haystack) || haystack.includes(compact(i.itemName))) : undefined;
    if (item) {
      openReceipt(raw, item.id);
      return { kind: "record", type: "item", id: item.id };
    }
    if (purchaseRequests.length > 0 && /\b(pr|purchase\s*request|requested\s*by|approval|procurement)\b/i.test(raw)) return { kind: "purchaseRequests" };

    return null;
  }

  function handleResult(text: string) {
    const raw = cleanCodeValue(text);
    setLastPayload(raw);
    try {
      const linkTarget = appLinkTarget(raw);
      if (linkTarget) return go(linkTarget);

      const fb = fallbackLookup(raw);
      if (fb) return go(fb);

      openReceipt(raw);
      toast.message("Barcode captured", {
        description: "No existing stock record matched, so the receive form is ready for a new lab item batch.",
      });
    } catch {
      toast.error("Could not parse code.");
    }
  }

  async function startScanner() {
    setActive(true);
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
    if (!containerRef.current) return;
    const id = "qr-reader-region";
    containerRef.current.innerHTML = `<div id="${id}" class="w-full"></div>`;
    const formats = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.PDF_417,
      Html5QrcodeSupportedFormats.AZTEC,
    ];
    const scanner = new Html5Qrcode(id, { formatsToSupport: formats, verbose: false });
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (vw: number, vh: number) => {
            const min = Math.min(vw, vh);
            const size = Math.floor(min * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.7777778,
        },
        (decoded) => handleResult(decoded),
        () => undefined,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/permission|NotAllowed/i.test(msg)) {
        toast.error("Camera permission denied", {
          description: "Allow camera access in your browser settings, then tap Start camera again.",
        });
      } else if (/NotFound|device/i.test(msg)) {
        toast.error("No camera found on this device.");
      } else if (/secure|https/i.test(msg) || (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost")) {
        toast.error("Camera requires HTTPS", {
          description: "Open the published https:// URL on your phone — most browsers block the camera on http://.",
        });
      } else {
        toast.error(msg || "Camera unavailable.");
      }
      setActive(false);
    }
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => undefined);
      scannerRef.current.clear?.();
      scannerRef.current = null;
    }
    if (containerRef.current) containerRef.current.innerHTML = "";
    setActive(false);
  }

  return (
    <div>
      <Header
        title="Scan QR / Barcode"
        description="Point a phone camera at any AMCE label to open the matching record instantly."
      />
      <div className="p-6 space-y-6 max-w-2xl">
        <section className="bg-card border border-border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" /> Camera scanner
            </div>
            {active ? (
              <Button size="sm" variant="outline" onClick={stopScanner}>
                <X className="h-4 w-4 mr-1" /> Stop
              </Button>
            ) : (
              <Button size="sm" onClick={startScanner}>
                <ScanLine className="h-4 w-4 mr-1" /> Start camera
              </Button>
            )}
          </div>
          <div ref={containerRef} className="rounded-md overflow-hidden bg-muted/40 min-h-[240px]" />
          <p className="text-xs text-muted-foreground">
            Use Chrome or Safari on a phone for best results. The browser will prompt for camera permission once.
          </p>
        </section>

        <section className="bg-card border border-border rounded-md p-4 space-y-3">
          <div className="font-semibold text-sm">Enter code manually</div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual">Paste a label URL, "type/id", or a batch/lot/serial number</Label>
            <div className="flex gap-2">
              <Input
                id="manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. BATCH-001, LOT-2025-04, full URL, or batch/<id>"
              />
              <Button onClick={() => handleResult(manual)} disabled={!manual.trim()}>
                Open
              </Button>
            </div>
            {lastPayload && (
              <div className="text-[11px] text-muted-foreground font-mono break-all">
                Last scan: {lastPayload}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
