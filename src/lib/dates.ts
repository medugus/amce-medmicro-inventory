// Date format helpers for AMCE.
//
// The app stores two date shapes:
//   - "YYYY-MM-DD" for date-only fields (expiry, dateReceived, dateAccepted)
//   - full ISO timestamps for moment-in-time fields (movement dateTime, audit)
//
// Forms accept loose user input (Date, datetime-local string, ISO string) and
// these helpers normalise to the canonical shape used in Dexie.

export function toISODate(input: Date | string | null | undefined): string | null {
  if (!input) return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return input.toISOString().slice(0, 10);
  }
  const s = String(input).trim();
  if (!s) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function toISODateTime(input: Date | string | null | undefined): string | null {
  if (!input) return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return input.toISOString();
  }
  const s = String(input).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISODateTime(): string {
  return new Date().toISOString();
}
