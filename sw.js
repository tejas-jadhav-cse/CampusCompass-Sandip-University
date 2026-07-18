// CampusCompass Service Worker
// Bump CACHE_VERSION whenever app-shell files change so clients pick up
// the new versions instead of serving stale cached copies forever.
const CACHE_VERSION = "v37";
const CACHE_NAME = `campuscompass-shell-${CACHE_VERSION}`;

// The app shell: everything needed for the app to boot and run fully
// offline. index.html already carries the full embedded dataset, so
// once this shell is cached the app works with zero network access.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/index.css",
  "./css/fonts.css",
  "./js/app.js",
  "./js/init.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/campus_banner.webp",
  "./assets/vendor/tailwind.js",
  "./assets/vendor/lucide.min.js",
  "./assets/fonts/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5DV_.woff2",
  "./assets/fonts/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_9qo.woff2",
  "./assets/fonts/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN6jV_9qo.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2",
  "./assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Add each shell file individually so a single missing/optional
      // file can't abort the whole install.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("SW: failed to precache", url, err);
          })
        )
      );
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

// Helper to validate responses before caching them.
// Ensures we only cache safe content types and do not cache corrupted/unexpected payloads.
function isValidResponseForCache(response, request) {
  if (!response || !response.ok) return false;

  // Do not cache range requests
  if (request.headers.has("Range")) return false;

  // Skip opaque/third-party responses
  if (response.type === "opaque") return false;

  // Ensure content type matches standard app-shell files
  const contentType = response.headers.get("Content-Type");
  if (contentType) {
    const isHtml = contentType.includes("html");
    const isCss = contentType.includes("css");
    const isJs = contentType.includes("javascript");
    const isJson = contentType.includes("json");
    const isImage = contentType.includes("image");
    const isFont = contentType.includes("font") || contentType.includes("application/x-font") || contentType.includes("application/font");

    if (!isHtml && !isCss && !isJs && !isJson && !isImage && !isFont) {
      return false;
    }
  }

  return true; // Fallback allow for general app shell assets (svg, CSS, JS, etc.)
}

/**
 * Helper to fetch a request with a timeout using AbortController.
 * Ensures that if a network request hangs, it fails gracefully and does not freeze the app.
 * @param {Request} request
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(request, timeoutMs = 8000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Network-first: try the network first and store the result in cache.
// If the network is slow, times out, or is offline, fall back to the cache.
// This ensures that when the user refreshes/reloads, they always get the latest assets
// and clear old cache entries immediately.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Try network first (with a short timeout of 3 seconds)
    const response = await fetchWithTimeout(request, 3000);
    if (isValidResponseForCache(response, request)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed or timed out -- fall back to cache
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Nothing cached and no network -- let the app's own offline handling take over
    return new Response(null, { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(request));
});
