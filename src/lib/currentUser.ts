// Lightweight named-user picker state. No password. Persisted in localStorage.
// The selected user is stamped onto every recorded action (movements,
// acceptance, quarantine, discard, supply updates) for the audit trail.

import { useEffect, useState, useCallback } from "react";
import { AMCE_USERS } from "@/data/amceUsers";
import type { AMCEUser } from "@/types";

const STORAGE_KEY = "amce.currentUserId";

function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUserId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("amce:current-user-changed"));
  } catch {
    // ignore
  }
}

export function getCurrentUser(): AMCEUser | null {
  const id = readStoredUserId();
  if (!id) return null;
  return AMCE_USERS.find((u) => u.id === id) ?? null;
}

export function setCurrentUser(id: string | null) {
  writeStoredUserId(id);
}

export function useCurrentUser(): {
  user: AMCEUser | null;
  setUser: (id: string | null) => void;
  users: AMCEUser[];
} {
  const [user, setUserState] = useState<AMCEUser | null>(() => getCurrentUser());

  useEffect(() => {
    function refresh() {
      setUserState(getCurrentUser());
    }
    window.addEventListener("amce:current-user-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("amce:current-user-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const setUser = useCallback((id: string | null) => {
    setCurrentUser(id);
    setUserState(getCurrentUser());
  }, []);

  return { user, setUser, users: AMCE_USERS };
}
