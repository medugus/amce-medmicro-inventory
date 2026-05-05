import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Camera, X } from "lucide-react";
import { toast } from "sonner";

export function ScanPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState("");

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current.clear?.();
        scannerRef.current = null;
      }
    };
  }, []);

  function handleResult(text: string) {
    // Accept full URLs or raw "type/id" payloads.
    try {
      let path = text.trim();
      if (path.startsWith("http")) {
        const url = new URL(path);
        path = url.pathname;
      }
      const m = path.match(/\/?r\/([^/]+)\/(.+)$/) ?? path.match(/^([^/]+)\/(.+)$/);
      if (!m) {
        toast.error("Unrecognised QR payload.");
        return;
      }
      const type = m[1];
      const id = decodeURIComponent(m[2]);
      stopScanner();
      navigate({ to: "/r/$type/$id", params: { type, id } });
    } catch {
      toast.error("Could not parse QR code.");
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
        () => undefined
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
            <Label htmlFor="manual">Paste a label URL or "type/id"</Label>
            <div className="flex gap-2">
              <Input
                id="manual"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. batch/BATCH-001 or full URL"
              />
              <Button onClick={() => handleResult(manual)} disabled={!manual.trim()}>
                Open
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
