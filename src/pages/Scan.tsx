import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useBatches, useEquipment, useDurables, useInventory } from "@/lib/useLiveData";
import type { QrEntityType } from "@/lib/qrLinks";

export function ScanPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState("");
  const [lastPayload, setLastPayload] = useState<string | null>(null);

  const batches = useBatches();
  const items = useInventory();
  const equipment = useEquipment();
  const durables = useDurables();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current.clear?.();
        scannerRef.current = null;
      }
    };
  }, []);

  function go(type: QrEntityType, id: string) {
    stopScanner();
    navigate({ to: "/r/$type/$id", params: { type, id } });
  }

  function fallbackLookup(raw: string): { type: QrEntityType; id: string } | null {
    const needle = raw.trim();
    if (!needle) return null;
    const lc = needle.toLowerCase();

    // Direct ID match
    if (batches.some((b) => b.id === needle)) return { type: "batch", id: needle };
    if (items.some((i) => i.id === needle)) return { type: "item", id: needle };
    if (equipment.some((e) => e.id === needle)) return { type: "equipment", id: needle };
    if (durables.some((d) => d.id === needle)) return { type: "durable", id: needle };

    // Batch / lot number
    const batch = batches.find(
      (b) => b.batchNumber?.toLowerCase() === lc || b.lotNumber?.toLowerCase() === lc,
    );
    if (batch) return { type: "batch", id: batch.id };

    // Equipment serial / asset number
    const eq = equipment.find(
      (e) => e.serialNumber?.toLowerCase() === lc || e.assetNumber?.toLowerCase() === lc,
    );
    if (eq) return { type: "equipment", id: eq.id };

    return null;
  }

  function handleResult(text: string) {
    const raw = text.trim();
    setLastPayload(raw);
    try {
      let path = raw;
      if (/^https?:\/\//i.test(path)) {
        try {
          const url = new URL(path);
          path = url.pathname;
        } catch {
          // fall through to fallback
        }
      }
      const m =
        path.match(/\/?r\/([^/]+)\/(.+)$/) ??
        path.match(/^(batch|equipment|durable|item)\/(.+)$/i);
      if (m) {
        const type = m[1].toLowerCase() as QrEntityType;
        const id = decodeURIComponent(m[2]);
        return go(type, id);
      }

      const fb = fallbackLookup(raw);
      if (fb) return go(fb.type, fb.id);

      toast.error("Code not recognised", {
        description: `Scanned: "${raw.length > 60 ? raw.slice(0, 60) + "…" : raw}". No matching batch, item, equipment or durable found.`,
      });
    } catch {
      toast.error("Could not parse code.");
    }
  }

  async function startScanner() {
    setActive(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    if (!containerRef.current) return;
    const id = "qr-reader-region";
    containerRef.current.innerHTML = `<div id="${id}" class="w-full"></div>`;
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => handleResult(decoded),
        () => undefined,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Camera unavailable.");
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
