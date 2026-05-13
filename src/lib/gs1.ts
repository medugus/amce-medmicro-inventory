// GS1 Application Identifier parser for GS1-128 and GS1 DataMatrix barcodes.
//
// Supports both parenthesised forms like (01)04150753412345(17)251031(10)LOT123
// and raw concatenated forms (with optional FNC1/GS group separator 0x1d).

export interface Gs1Parsed {
  gtin?: string;          // AI 01 — 14-digit Global Trade Item Number
  lotNumber?: string;     // AI 10 — variable
  expiryDate?: string;    // AI 17 — ISO YYYY-MM-DD
  serialNumber?: string;  // AI 21 — variable
  raw: string;
  isGs1: boolean;
}

const GS = String.fromCharCode(0x1d); // FNC1 / Group Separator

// Variable-length AIs end at the next AI or at a GS char or at end of string.
const VARIABLE_AIS = new Set(["10", "21", "22", "240", "241", "242", "250", "251", "30", "37", "390", "400", "401", "410", "414", "420", "421", "422", "423"]);

// Fixed-length AIs (AI -> length not including AI itself)
const FIXED_AIS: Record<string, number> = {
  "00": 18,
  "01": 14,
  "02": 14,
  "11": 6,
  "12": 6,
  "13": 6,
  "15": 6,
  "16": 6,
  "17": 6,
  "20": 2,
};

function yymmddToIso(s: string): string | undefined {
  if (!/^\d{6}$/.test(s)) return undefined;
  const yy = Number(s.slice(0, 2));
  const mm = s.slice(2, 4);
  const ddRaw = s.slice(4, 6);
  // GS1 spec: if DD = 00, treat as last day of month — for display use 01 fallback.
  const dd = ddRaw === "00" ? "01" : ddRaw;
  // Two-digit year window: GS1 says +50/-49 from current year
  const currentYY = new Date().getFullYear() % 100;
  const century = (yy - currentYY + 100) % 100 < 50 ? 2000 : 1900;
  const year = century + yy;
  return `${year}-${mm}-${dd}`;
}

export function formatExpiryForDisplay(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function stripSymbology(s: string): string {
  // Remove leading symbology identifier like ]C1, ]d2, ]Q3 etc.
  if (s.startsWith("]") && s.length >= 3) return s.slice(3);
  return s;
}

export function parseGs1(input: string): Gs1Parsed {
  const raw = (input ?? "").trim();
  const out: Gs1Parsed = { raw, isGs1: false };
  if (!raw) return out;

  let text = stripSymbology(raw.normalize("NFKC")).trim();

  // Parenthesised form
  if (/\(\d{2,4}\)/.test(text)) {
    const re = /\((\d{2,4})\)([^()]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      assign(out, m[1], (m[2] || "").trim());
    }
    out.isGs1 = !!(out.gtin || out.lotNumber || out.expiryDate || out.serialNumber);
    return out;
  }

  // Raw concatenated form — must start with digits
  if (!/^\d/.test(text)) return out;

  let i = 0;
  while (i < text.length) {
    // Skip GS separators
    while (i < text.length && text[i] === GS) i++;
    if (i >= text.length) break;
    // Try AI lengths 2,3,4
    let ai: string | null = null;
    for (const len of [2, 3, 4]) {
      const candidate = text.slice(i, i + len);
      if (FIXED_AIS[candidate] != null || VARIABLE_AIS.has(candidate)) {
        ai = candidate;
        break;
      }
    }
    if (!ai) break;
    i += ai.length;

    let value = "";
    if (FIXED_AIS[ai] != null) {
      const len = FIXED_AIS[ai];
      value = text.slice(i, i + len);
      i += len;
    } else {
      // Variable length — consume up to GS or end
      const gsIdx = text.indexOf(GS, i);
      const end = gsIdx === -1 ? text.length : gsIdx;
      value = text.slice(i, end);
      i = end;
    }
    assign(out, ai, value);
  }

  out.isGs1 = !!(out.gtin || out.lotNumber || out.expiryDate || out.serialNumber);
  return out;
}

function assign(out: Gs1Parsed, ai: string, value: string) {
  const v = value.trim();
  if (!v) return;
  switch (ai) {
    case "01":
      // Pad to 14 digits if shorter (GTIN-8/12/13 → 14)
      if (/^\d{8,14}$/.test(v)) out.gtin = v.padStart(14, "0");
      break;
    case "10":
      out.lotNumber = v;
      break;
    case "17":
      out.expiryDate = yymmddToIso(v) ?? out.expiryDate;
      break;
    case "21":
      out.serialNumber = v;
      break;
  }
}

// Detect a plain GTIN (numeric, 8/12/13/14 digits with valid check digit ideally,
// but we are lenient and accept any 12-14 digit numeric string).
export function plainGtin(input: string): string | undefined {
  const t = (input ?? "").trim();
  if (/^\d{12,14}$/.test(t)) return t.padStart(14, "0");
  if (/^\d{8}$/.test(t)) return t.padStart(14, "0");
  return undefined;
}
