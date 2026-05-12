import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

interface ExportButtonProps {
  rows?: Array<Record<string, unknown>>;
  filename?: string;
  /** Optional ref to a table element. If not provided, the closest <table> in the page is used. */
  tableRef?: React.RefObject<HTMLTableElement>;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return lines.join("\n");
}

function tableToCsv(table: HTMLTableElement): string {
  const rows: string[] = [];
  for (const tr of Array.from(table.rows)) {
    const cells = Array.from(tr.cells).map((c) =>
      csvEscape((c.innerText ?? c.textContent ?? "").trim().replace(/\s+/g, " "))
    );
    rows.push(cells.join(","));
  }
  return rows.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportButton({ rows, filename, tableRef }: ExportButtonProps = {}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const baseName =
      filename ||
      (typeof document !== "undefined" && document.title
        ? document.title.replace(/[^\w\-]+/g, "_").slice(0, 60)
        : "export");
    const finalName = `${baseName}_${stamp}.csv`;

    let csv = "";
    if (rows && rows.length > 0) {
      csv = rowsToCsv(rows);
    } else {
      // Fallback: find nearest table in the document
      const table =
        tableRef?.current ??
        (btnRef.current?.closest("main")?.querySelector("table") as HTMLTableElement | null) ??
        (document.querySelector("main table") as HTMLTableElement | null) ??
        (document.querySelector("table") as HTMLTableElement | null);
      if (!table) {
        toast.error("Nothing to export on this page.");
        return;
      }
      csv = tableToCsv(table);
    }

    if (!csv.trim()) {
      toast.error("No data to export.");
      return;
    }

    downloadCsv(csv, finalName);
    toast.success("Export downloaded.");
  };

  return (
    <Button ref={btnRef} variant="outline" size="sm" onClick={handleClick} className="gap-2">
      <Download className="h-4 w-4" /> Export
    </Button>
  );
}
