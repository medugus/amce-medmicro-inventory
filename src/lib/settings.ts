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
