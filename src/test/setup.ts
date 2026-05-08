// Vitest setup: install fake-indexeddb so Dexie can run in Node tests, and
// stub localStorage so currentUser helpers work.
import "fake-indexeddb/auto";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, String(v)); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
  get length() { return this.store.size; }
}

if (typeof globalThis.localStorage === "undefined") {
  // @ts-expect-error - polyfill
  globalThis.localStorage = new MemoryStorage();
}
if (typeof globalThis.window === "undefined") {
  // @ts-expect-error - minimal window shim for currentUser events
  globalThis.window = {
    localStorage: globalThis.localStorage,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    CustomEvent: class { constructor(_t: string, _i?: unknown) {} },
  };
  // @ts-expect-error
  globalThis.CustomEvent = globalThis.window.CustomEvent;
}
