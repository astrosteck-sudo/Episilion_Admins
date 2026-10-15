/*
 * App-shell service worker.
 *
 * The API is never cached: this is an admin console where stale hostel data or a
 * stale auth response would be actively harmful. Only the shell (HTML, JS, CSS,
 * fonts, icons) is cached so the app opens instantly and survives a flaky
 * connection.
 */

const CACHE_NAME = 'episilion-shell-v1';

/** Requests that must always hit the network. */
function isBypassed(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.endsWith('onrender.com') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('googleapis.com')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', '/manifest.json', '/apple-touch-icon.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isBypassed(url)) return;

  // Navigations: network first so a new deploy is picked up, falling back to the
  // cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || Response.error()))
    );
    return;
  }

  // Static assets are content-hashed by Metro, so cache-first is safe.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
