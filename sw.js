// CampusCompass Service Worker
// Bump CACHE_VERSION whenever app-shell files change so clients pick up
// the new versions instead of serving stale cached copies forever.
const CACHE_VERSION = "v3";
const CACHE_NAME = `campuscompass-shell-${CACHE_VERSION}`;

// The app shell: everything needed for the app to boot and run fully
// offline. index.html already carries the full embedded dataset, so
// once this shell is cached the app works with zero network access.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// The external dataset file is optional (index.html falls back to its
// embedded copy if this fetch fails), but we still cache it opportunistically
// so a fresh copy is available offline if it's ever present alongside the app.
const DATA_URL = "./sandip_university_campus.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Add each shell file individually so a single missing/optional
      // file (e.g. the external dataset not being present) can't abort
      // the whole install.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("SW: failed to precache", url, err);
          })
        )
      );
      // Best-effort: also try to warm the cache with the external dataset.
      await cache.add(DATA_URL).catch(() => {
        // Fine if this isn't present; index.html has an embedded fallback.
      });
      // Activate this SW immediately rather than waiting for old tabs to close.
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove any caches from previous versions of this app.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("campuscompass-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Stale-while-revalidate: serve the cached response immediately (if any)
// while kicking off a network request in the background to refresh the
// cache for next time.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await networkFetch) || new Response(null, { status: 504 });
}

// Cache-first: use the cached copy if we have one, otherwise go to the
// network and store the result for next time. Good for static, rarely
// changing app-shell assets.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Nothing cached and no network -- let the app's own offline
    // handling (embedded dataset / offline banner) take over.
    return new Response(null, { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests; let everything else (CDN
  // scripts for Tailwind/Lucide, cross-origin calls, POSTs, etc.) pass
  // straight through to the network as normal.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const isDataFile = url.pathname.endsWith("sandip_university_campus.json");

  if (isDataFile) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
