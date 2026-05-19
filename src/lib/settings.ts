import { useEffect, useState } from "react";

const KEY = "amce:maintWindowDays";
const DEFAULT_DAYS = 14;

export function getMaintWindowDays(): number {
  if (typeof window === "undefined") return DEFAULT_DAYS;
  const v = Number(window.localStorage.getItem(KEY));
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DAYS;
}

export function setMaintWindowDays(days: number) {
  window.localStorage.setItem(KEY, String(days));
  window.dispatchEvent(new CustomEvent("amce:settings-changed"));
}

export function useMaintWindowDays(): number {
  const [d, setD] = useState<number>(getMaintWindowDays());
  useEffect(() => {
    const fn = () => setD(getMaintWindowDays());
    window.addEventListener("amce:settings-changed", fn);
    return () => window.removeEventListener("amce:settings-changed", fn);
  }, []);
  return d;
}

// --- Procurement digest recipients ---

const LAB_MGR_KEY = "amce:labManagerEmail";
const HEAD_KEY = "amce:headOfUnitEmail";
const DEFAULT_LAB_MGR = "nmedugu@amce.net";
const DEFAULT_HEAD = "eekoh@amce.net";

export function getLabManagerEmail(): string {
  if (typeof window === "undefined") return DEFAULT_LAB_MGR;
  return window.localStorage.getItem(LAB_MGR_KEY) ?? DEFAULT_LAB_MGR;
}
export function getHeadOfUnitEmail(): string {
  if (typeof window === "undefined") return DEFAULT_HEAD;
  return window.localStorage.getItem(HEAD_KEY) ?? DEFAULT_HEAD;
}
export function setLabManagerEmail(v: string) {
  window.localStorage.setItem(LAB_MGR_KEY, v);
  window.dispatchEvent(new CustomEvent("amce:settings-changed"));
}
export function setHeadOfUnitEmail(v: string) {
  window.localStorage.setItem(HEAD_KEY, v);
  window.dispatchEvent(new CustomEvent("amce:settings-changed"));
}

export function useProcurementRecipients() {
  const [labManager, setLM] = useState(getLabManagerEmail());
  const [headOfUnit, setHU] = useState(getHeadOfUnitEmail());
  useEffect(() => {
    const fn = () => { setLM(getLabManagerEmail()); setHU(getHeadOfUnitEmail()); };
    window.addEventListener("amce:settings-changed", fn);
    return () => window.removeEventListener("amce:settings-changed", fn);
  }, []);
  return { labManager, headOfUnit };
}
