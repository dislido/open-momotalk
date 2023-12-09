const sw = self as ServiceWorkerGlobalScope & typeof globalThis;

declare const CACHE_NAME: string;
declare const APP_STATIC_RESOURCES: string[];

const cacheName = CACHE_NAME;
const appStaticResources = APP_STATIC_RESOURCES;

sw.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(appStaticResources);
    })(),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== cacheName) {
            return caches.delete(name);
          }
        }),
      );
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener('message', (e) => {
  if (e.data === 'update') {
    sw.skipWaiting();
  }
});

sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (appStaticResources.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(event.request.url);
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response(null, { status: 404 });
      })(),
    );
  }
});
