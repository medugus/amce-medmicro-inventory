// Service worker registration, guarded against:
//  - SSR (no window)
//  - iframes (Lovable preview is an iframe)
//  - Lovable preview hosts (id-preview--*, lovableproject.com)
// Only registers on the real published origin so the editor preview keeps
// working while the lab-PC install is fully offline-capable.

export function registerOfflineServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost) {
    // Tear down any old SW that might have been registered in error.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }

  // Register after load so it doesn't compete with first paint.
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
