import { useEffect, useState } from "react";

const MAINT_KEY = "amce:maintWindowDays";
const PROCUREMENT_EMAIL_KEY = "amce:procurementEmail";
const DEFAULT_DAYS = 14;

export function getMaintWindowDays(): number {
  if (typeof window === "undefined") return DEFAULT_DAYS;
  const v = Number(window.localStorage.getItem(MAINT_KEY));
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DAYS;
}

export function setMaintWindowDays(days: number) {
  window.localStorage.setItem(MAINT_KEY, String(days));
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


export function getProcurementEmail(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(PROCUREMENT_EMAIL_KEY) ?? "").trim();
}

export function setProcurementEmail(email: string) {
  window.localStorage.setItem(PROCUREMENT_EMAIL_KEY, email.trim());
  window.dispatchEvent(new CustomEvent("amce:settings-changed"));
}

export function useProcurementEmail(): string {
  const [email, setEmail] = useState<string>(getProcurementEmail());
  useEffect(() => {
    const fn = () => setEmail(getProcurementEmail());
    window.addEventListener("amce:settings-changed", fn);
    return () => window.removeEventListener("amce:settings-changed", fn);
  }, []);
  return email;
}
