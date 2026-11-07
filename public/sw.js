/**
 * Tracesmith service worker.
 *
 * Deliberately conservative. A clever service worker that serves a stale app
 * is far worse than none at all, so:
 *
 *   - Anything under /api/ or /auth/ is never cached. Live data stays live.
 *   - Build assets under /_next/static/ are cache-first. Their URLs contain a
 *     content hash, so a cached one can never be out of date.
 *   - Pages are network-first with a cache fallback, so you always get the
 *     current lesson when online and a readable one when not.
 *   - A lesson you have opened before stays readable offline, which is the
 *     point of installing this on a phone.
 */

const VERSION = "tracesmith-v1";
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

const PRECACHE = ["/offline", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    // sql-wasm.wasm is large and changes only when the dependency does, so
    // it is cache-first too — otherwise the SQL lesson needs the network.
    /\.(?:png|jpg|jpeg|svg|webp|woff2?|ico|wasm)$/.test(url.pathname)
  );
}

function isPrivate(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url)) return;

  // Hashed build output: safe to serve from cache forever.
  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Pages: prefer the network, fall back to what we have, then to /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match("/offline")),
        ),
    );
  }
});

// Let the page tell a waiting worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
