// Minimal "kill-switch" / offline service worker for AMCE Microbiology.
// Caches the app shell + built assets so the lab PC can run fully offline
// after the first visit while connected.
//
// Strategy:
//   - HTML navigations: network-first with a 3s timeout, fall back to cache.
//   - Static assets (JS/CSS/img/fonts): stale-while-revalidate.
//   - Old caches are cleared on activate.
//
// This worker only registers on the published origin (see src/lib/registerSW.ts).

const CACHE_VERSION = "amce-v2-durables";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      try { await cache.addAll(APP_SHELL); } catch { /* offline first install */ }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first.
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        const fresh = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
        ]);
        if (fresh && fresh instanceof Response) {
          cache.put(req, fresh.clone());
          return fresh;
        }
        throw new Error("no response");
      } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        const shell = await cache.match("/");
        if (shell) return shell;
        return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
      }
    })());
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    const networkPromise = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    const fresh = await networkPromise;
    return fresh || cached || new Response("Offline", { status: 503 });
  })());
});
