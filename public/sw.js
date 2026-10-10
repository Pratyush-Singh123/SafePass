// SafePass Emergency Offline Service Worker
// Enables 100% offline access when cellular backhaul and internet grids fail

const CACHE_NAME = 'safepass-offline-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

// Install: Cache critical core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache non-fatal error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Prune outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate & Offline Navigation Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension schemes
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle SPA Navigation (HTML pages like /chat, /dashboard, /login)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Update cache with fresh HTML
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: Serve cached /index.html so React Router mounts locally
          const cachedHtml = await caches.match('/index.html');
          if (cachedHtml) return cachedHtml;
          return caches.match('/');
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, images, icons, fonts, leaflet assets)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately, revalidate in background if online
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // Completely offline, ignore background fetch error
          });
        return cachedResponse;
      }

      // Not in cache: fetch from network and store for next time
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin || url.hostname.includes('openstreetmap') || url.hostname.includes('cdnjs'))
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for assets
          if (request.destination === 'image') {
            return caches.match('/vite.svg');
          }
          return new Response('Offline: Asset not in cache', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
