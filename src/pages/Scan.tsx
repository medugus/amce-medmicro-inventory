import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScanLine, Camera, X, PackagePlus, CheckCircle2, AlertCircle, ChevronDown, History, Save } from "lucide-react";
import { toast } from "sonner";
import { useBatches, useDataReady, useEquipment, useDurables, useInventory, usePurchaseRequests, useScanHistory } from "@/lib/useLiveData";
import type { QrEntityType } from "@/lib/qrLinks";
import { AMCE_BATCHES } from "@/data/amceBatches";
import { AMCE_INVENTORY_MASTER } from "@/data/amceInventoryMaster";
import { AMCE_DURABLES, AMCE_EQUIPMENT } from "@/data/amceAssets";
import { AMCE_SECTIONS } from "@/data/amceSections";
import { ReceiveBatchDialog } from "@/components/forms/ReceiveBatchDialog";
import { InventoryItemPicker } from "@/components/forms/InventoryItemPicker";
import { Switch } from "@/components/ui/switch";
import { recordAcceptance } from "@/lib/actions";
import { getCurrentUser } from "@/lib/currentUser";
import { parseGs1, plainGtin, formatExpiryForDisplay, type Gs1Parsed } from "@/lib/gs1";
import { getGtinEntry, upsertGtinEntry, touchGtinSeen, recordScan } from "@/lib/gtinActions";
import type { GtinCatalogueEntry, GtinCategory, LaboratorySectionId } from "@/types";

const AUTO_RECEIVE_KEY = "amce.scan.autoReceive";
function getAutoReceive(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTO_RECEIVE_KEY) !== "0";
}
function setAutoReceivePref(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_RECEIVE_KEY, v ? "1" : "0");
}

type ScannerTarget =
  | { kind: "record"; type: QrEntityType; id: string }
  | { kind: "receive"; scannedCode: string; inventoryItemId?: string }
  | { kind: "purchaseRequests" };

const TYPE_ALIASES: Record<string, QrEntityType | "purchaseRequests"> = {
  batch: "batch", batches: "batch", lot: "batch", lots: "batch", b: "batch",
  item: "item", inventory: "item", inv: "item", sku: "item",
  equipment: "equipment", eq: "equipment", asset: "equipment",
  durable: "durable", durables: "durable", dur: "durable",
  pr: "purchaseRequests", purchase: "purchaseRequests",
  "purchase-request": "purchaseRequests", "purchase-requests": "purchaseRequests",
};

const GTIN_CATEGORIES: GtinCategory[] = ["culture media", "reagent", "consumable", "PPE", "equipment", "other"];

function cleanCodeValue(value: string): string {
  let text = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, "").trim();
  if (text.startsWith("]") && text.length > 3) text = text.slice(3).trim();
  try { text = decodeURIComponent(text); } catch { /* keep original */ }
  return text.replace(/^['"]+|['"]+$/g, "").trim();
}
function canonical(value: string): string {
  return cleanCodeValue(value).toLowerCase().replace(/[‐‑‒–—−]/g, "-").replace(/\s+/g, " ").trim();
}
function compact(value: string): string { return canonical(value).replace(/[^a-z0-9]/g, ""); }
function equalCode(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  return canonical(a) === canonical(b) || compact(a) === compact(b);
}

function appLinkTarget(raw: string): ScannerTarget | null {
  const cleaned = cleanCodeValue(raw);
  let path = cleaned;
  try { path = new URL(cleaned).pathname; } catch { /* not a URL */ }
  const match = path.match(/\/?r\/([^/]+)\/(.+)$/i);
  if (!match) return null;
  const type = TYPE_ALIASES[canonical(match[1])];
  if (!type) return null;
  if (type === "purchaseRequests") return { kind: "purchaseRequests" };
  return { kind: "record", type, id: cleanCodeValue(match[2]) };
}

interface ParsedScan {
  raw: string;
  gs1: Gs1Parsed;
  gtin?: string;
  catalogue?: GtinCatalogueEntry;
  matchedBatchId?: string;
  matchedItemId?: string;
}

export function ScanPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState("");

  const [parsed, setParsed] = useState<ParsedScan | null>(null);
  // Editable form fields driven from parsed scan
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // ISO YYYY-MM-DD
  const [serialNumber, setSerialNumber] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GtinCategory>("reagent");
  const [linkedItemId, setLinkedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [section, setSection] = useState<LaboratorySectionId>("stores");
  const [autoReceive, setAutoReceive] = useState<boolean>(() => getAutoReceive());

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveItemId, setReceiveItemId] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

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
  const recentScans = useScanHistory(10);
  const scanBatches = batches.length ? batches : AMCE_BATCHES;
  const scanItems = items.length ? items : AMCE_INVENTORY_MASTER;
  const scanEquipment = equipment.length ? equipment : AMCE_EQUIPMENT;
  const scanDurables = durables.length ? durables : AMCE_DURABLES;
  const acceptBatch = scanBatches.find((b) => b.id === acceptBatchId);
  const acceptItem = acceptBatch ? scanItems.find((i) => i.id === acceptBatch.inventoryItemId) : undefined;

  const sections = useMemo(() => AMCE_SECTIONS.filter((s) => s.active), []);
  const isKnown = !!parsed?.catalogue;

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
    if (target.kind === "purchaseRequests") return navigate({ to: "/purchase-requests" });
    if (target.kind === "receive") return openReceipt(target.scannedCode, target.inventoryItemId ?? "");
    if (target.type === "item") return openReceipt("", target.id);
    if (target.type === "batch") {
      const batch = scanBatches.find((b) => b.id === target.id);
      if (batch?.acceptanceStatus === "Pending acceptance" || batch?.batchStatus === "Pending acceptance") {
        return openAcceptance(target.id);
      }
    }
    navigate({ to: "/r/$type/$id", params: { type: target.type, id: target.id } });
  }

  function openReceipt(scannedCode = "", inventoryItemId = "") {
    stopScanner();
    setReceiveCode(scannedCode);
    setReceiveItemId(inventoryItemId);
    setReceiveOpen(true);
  }
  function openAcceptance(batchId: string) {
    stopScanner();
    setAcceptBatchId(batchId);
    setDecision("Accepted"); setQcResult("Pass"); setCoa(true);
    setPhysical("Acceptable"); setComments(""); setCorrective("");
    setAcceptOpen(true);
  }

  async function saveAcceptance() {
    const user = getCurrentUser();
    if (!user) { toast.error("Select a user in the top bar first."); return; }
    if (!acceptBatchId) { toast.error("Scan or select a batch first."); return; }
    if (decision === "Rejected" && !corrective.trim()) { toast.error("Corrective action is required when rejecting."); return; }
    setAccepting(true);
    try {
      await recordAcceptance({
        batchId: acceptBatchId, decision, qcResult,
        certificateOfAnalysisAvailable: coa, physicalCondition: physical,
        comments, correctiveActionIfRejected: corrective,
      });
      toast.success(`Batch ${decision.toLowerCase()} into the lab by ${user.name}.`);
      setAcceptOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept batch.");
    } finally {
      setAccepting(false);
    }
  }

  function findExistingMatches(raw: string, gs1: Gs1Parsed) {
    let matchedBatchId: string | undefined;
    let matchedItemId: string | undefined;
    const codes = [raw, gs1.lotNumber, gs1.serialNumber, gs1.gtin].filter((v): v is string => !!v);
    for (const code of codes) {
      const batch = scanBatches.find(
        (b) => equalCode(b.id, code) || equalCode(b.batchNumber, code) || equalCode(b.lotNumber, code)
      );
      if (batch) { matchedBatchId = batch.id; break; }
    }
    for (const code of codes) {
      const item = scanItems.find(
        (i) => equalCode(i.id, code) || equalCode(i.catalogueNumber, code) || equalCode(i.itemName, code)
      );
      if (item) { matchedItemId = item.id; break; }
    }
    return { matchedBatchId, matchedItemId };
  }

  async function handleResult(text: string) {
    const raw = cleanCodeValue(text);
    if (!raw) return;
    setManual(raw);

    // App link short-circuit (existing /r/<type>/<id> deep links)
    const link = appLinkTarget(raw);
    if (link) {
      void recordScan({
        gtin: null, lotNumber: null, expiryDate: null, productName: null,
        rawCode: raw, action: "Opened deep link",
      });
      return go(link);
    }

    const gs1 = parseGs1(raw);
    const gtin = gs1.gtin ?? plainGtin(raw);
    let catalogue: GtinCatalogueEntry | undefined;
    if (gtin) catalogue = await getGtinEntry(gtin);
    const matches = findExistingMatches(raw, gs1);

    const next: ParsedScan = { raw, gs1, gtin, catalogue, ...matches };
    setParsed(next);

    // Populate form fields
    setProductName(catalogue?.productName ?? "");
    setManufacturer(catalogue?.manufacturer ?? "");
    setLotNumber(gs1.lotNumber ?? "");
    setExpiryDate(gs1.expiryDate ?? "");
    setSerialNumber(gs1.serialNumber ?? "");
    setUnit(catalogue?.unit ?? "");
    setCategory((catalogue?.category as GtinCategory | undefined) ?? "reagent");
    setQuantity("1");

    if (gtin && catalogue) {
      void touchGtinSeen(gtin);
      toast.success(`Recognised: ${catalogue.productName}`);
    } else if (gtin) {
      toast.message("New product — please name it below to save it to the catalogue.");
    } else if (matches.matchedBatchId || matches.matchedItemId) {
      toast.success("Matched an existing record.");
    } else {
      toast.message("Barcode captured", {
        description: "No GTIN found and no record matched — fill in the details below.",
      });
    }

    stopScanner();
  }

  async function persistGtinIfNeeded(): Promise<string | undefined> {
    if (!parsed?.gtin) return undefined;
    if (!productName.trim()) {
      toast.error("Enter a product name before saving.");
      return undefined;
    }
    await upsertGtinEntry({
      gtin: parsed.gtin,
      productName: productName.trim(),
      manufacturer: manufacturer.trim() || null,
      unit: unit.trim() || null,
      category,
      inventoryItemId: parsed.catalogue?.inventoryItemId ?? null,
    });
    return parsed.gtin;
  }

  async function onReceiveIntoInventory() {
    if (!parsed) return;
    if (parsed.matchedBatchId) return openAcceptance(parsed.matchedBatchId);
    await persistGtinIfNeeded();
    void recordScan({
      gtin: parsed.gtin ?? null,
      lotNumber: lotNumber || null,
      expiryDate: expiryDate || null,
      productName: productName || null,
      rawCode: parsed.raw,
      action: "Receive into inventory",
    });
    // Hand off to existing receive dialog (it parses GS1 string for lot/expiry)
    openReceipt(parsed.raw, parsed.matchedItemId ?? parsed.catalogue?.inventoryItemId ?? "");
  }

  function onOpenExisting() {
    if (!parsed) return;
    if (parsed.matchedBatchId) {
      void recordScan({
        gtin: parsed.gtin ?? null,
        lotNumber: lotNumber || null, expiryDate: expiryDate || null,
        productName: productName || null, rawCode: parsed.raw,
        action: "Opened existing batch",
      });
      return navigate({ to: "/r/$type/$id", params: { type: "batch", id: parsed.matchedBatchId } });
    }
    if (parsed.matchedItemId) {
      void recordScan({
        gtin: parsed.gtin ?? null,
        lotNumber: lotNumber || null, expiryDate: expiryDate || null,
        productName: productName || null, rawCode: parsed.raw,
        action: "Opened existing item",
      });
      return navigate({ to: "/r/$type/$id", params: { type: "item", id: parsed.matchedItemId } });
    }
    toast.message("No existing batch or item matched this scan.");
  }

  async function onSaveCatalogueOnly() {
    if (!parsed?.gtin) {
      toast.error("This scan has no GTIN to save.");
      return;
    }
    const gtin = await persistGtinIfNeeded();
    if (!gtin) return;
    void recordScan({
      gtin, lotNumber: null, expiryDate: null,
      productName: productName || null, rawCode: parsed.raw,
      action: "Saved GTIN to catalogue",
    });
    toast.success("Saved to GTIN catalogue.");
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
        (decoded) => { void handleResult(decoded); },
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

  // void these to silence unused-var without removing the data subscriptions
  void purchaseRequests; void scanEquipment; void scanDurables;

  return (
    <div>
      <Header
        title="Scan QR / Barcode"
        description="Scan supplier barcodes or AMCE labels. GS1 codes auto-parse GTIN, lot, expiry and serial."
      />
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Section A — Scanner */}
        <section className="bg-card border border-border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" /> Camera scanner
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openReceipt(manual)}>
                <PackagePlus className="h-4 w-4 mr-1" /> Receive
              </Button>
              {active ? (
                <Button size="sm" variant="outline" onClick={stopScanner}>
                  <X className="h-4 w-4 mr-1" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={startScanner} disabled={!dataReady}>
                  <ScanLine className="h-4 w-4 mr-1" /> Start camera
                </Button>
              )}
            </div>
          </div>
          <div ref={containerRef} className="rounded-md overflow-hidden bg-muted/40 min-h-[240px]" />
          <div className="space-y-2">
            <Label htmlFor="manual" className="text-xs">Or paste a barcode / GS1 string / link</Label>
            <div className="flex gap-2">
              <Input
                id="manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="(01)04150753412345(17)251031(10)LOT123"
              />
              <Button onClick={() => void handleResult(manual)} disabled={!manual.trim()}>
                Read
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use Chrome or Safari on a phone for best results. The browser will prompt for camera permission once.
          </p>
        </section>

        {/* Section B — Parsed fields */}
        {parsed && (
          <section className="bg-card border border-border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-semibold text-sm">Parsed details</div>
              {parsed.gtin ? (
                isKnown ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Known item
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> New item — please name this product
                  </Badge>
                )
              ) : (
                <Badge variant="outline">No GTIN detected</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Product name</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Mueller Hinton Agar"
                  readOnly={isKnown}
                />
              </div>
              <div>
                <Label className="text-xs">Manufacturer</Label>
                <Input
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  readOnly={isKnown}
                />
              </div>
              <div>
                <Label className="text-xs">GTIN</Label>
                <Input value={parsed.gtin ?? ""} readOnly placeholder="—" />
              </div>
              <div>
                <Label className="text-xs">Lot / Batch number</Label>
                <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">
                  Expiry date {expiryDate && <span className="text-muted-foreground">({formatExpiryForDisplay(expiryDate)})</span>}
                </Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Serial number</Label>
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. box of 10 plates"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as GtinCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GTIN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quantity received</Label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Section / bench</Label>
                <Select value={section} onValueChange={(v) => setSection(v as LaboratorySectionId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {parsed.matchedBatchId && (
              <div className="text-xs rounded-md bg-muted/40 p-2">
                Matched existing batch — open it to confirm or run acceptance testing.
              </div>
            )}

            {/* Section C — Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => void onReceiveIntoInventory()}>
                <PackagePlus className="h-4 w-4 mr-1" /> Receive into inventory
              </Button>
              {(parsed.matchedBatchId || parsed.matchedItemId) && (
                <Button variant="outline" onClick={onOpenExisting}>
                  Open existing record
                </Button>
              )}
              {parsed.gtin && (
                <Button size="sm" variant="ghost" onClick={() => void onSaveCatalogueOnly()}>
                  <Save className="h-4 w-4 mr-1" /> Save GTIN to catalogue only
                </Button>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground font-mono break-all border-t border-border pt-2">
              {parsed.raw}
            </div>
          </section>
        )}

        {/* Recent scans */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <section className="bg-card border border-border rounded-md">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" /> Recent scans ({recentScans.length})
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                {recentScans.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4">No scans yet.</div>
                ) : (
                  <ul className="divide-y divide-border text-xs">
                    {recentScans.map((s) => (
                      <li key={s.id} className="py-2 flex flex-col gap-0.5">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-foreground truncate">
                            {s.productName ?? s.gtin ?? s.rawCode.slice(0, 24)}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {new Date(s.scannedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {s.lotNumber ? `Lot ${s.lotNumber} · ` : ""}{s.action}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>

      <ReceiveBatchDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        defaultInventoryItemId={receiveItemId}
        scannedCode={receiveCode}
        onCreated={(batchId) => openAcceptance(batchId)}
      />
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Accept item into lab</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="font-medium">{acceptItem?.itemName ?? "Scanned batch"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Batch {acceptBatch?.batchNumber ?? acceptBatchId} {acceptBatch?.lotNumber ? `• Lot ${acceptBatch.lotNumber}` : ""}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Decision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as "Accepted" | "Rejected")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">QC result</Label>
                <Select value={qcResult} onValueChange={(v) => setQcResult(v as typeof qcResult)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pass">Pass</SelectItem>
                    <SelectItem value="Fail">Fail</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Not required">Not required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Physical condition</Label>
                <Select value={physical} onValueChange={(v) => setPhysical(v as typeof physical)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acceptable">Acceptable</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Compromised">Compromised</SelectItem>
                    <SelectItem value="Pending review">Pending review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs mt-6">
                <Checkbox checked={coa} onCheckedChange={(v) => setCoa(v === true)} />
                Certificate of Analysis available
              </label>
            </div>
            <div>
              <Label className="text-xs">Comments</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
            {decision === "Rejected" && (
              <div>
                <Label className="text-xs">Corrective action</Label>
                <Textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAcceptOpen(false)}>Cancel</Button>
              <Button onClick={() => void saveAcceptance()} disabled={accepting}>
                {accepting ? "Saving…" : "Save acceptance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
