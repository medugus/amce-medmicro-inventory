// The app is now a live shared document, so we intentionally do not register a
// caching service worker. If an older installed copy has one, tear it down so
// phones load the latest app and realtime sync code.

export function registerOfflineServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}
