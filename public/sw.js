// Service worker cleanup for AMCE Microbiology.
// The app is now a live shared document, so installed phones must not keep an
// old cached app shell. This worker clears every cache, reloads open clients,
// then unregisters itself. Keep this file in place for at least one release.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(clients.map((client) => {
        const url = new URL(client.url);
        url.searchParams.set("sw-cleanup", Date.now().toString());
        return client.navigate(url.toString());
      }));
      await self.registration.unregister();
    })()
  );
});
