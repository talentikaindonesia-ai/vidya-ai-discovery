/**
 * Talentika Service Worker
 * Strategy:
 *  - Static assets (JS/CSS/fonts/images) → Cache-First (long TTL)
 *  - HTML navigation requests           → Network-First (always fresh shell)
 *  - Supabase API calls                 → Network-Only (never cache auth/data)
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE  = `talentika-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `talentika-images-${CACHE_VERSION}`;

// Assets precached on install (Vite build outputs)
const PRECACHE_URLS = ["/", "/manifest.json"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate (clean up old caches) ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k !== STATIC_CACHE && k !== IMAGE_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET and Supabase/auth requests entirely (network-only)
  if (
    request.method !== "GET" ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/auth")
  ) {
    return;
  }

  // 2. HTML navigation → Network-First (fallback to cache)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
    return;
  }

  // 3. Images → Cache-First (store up to 60 days)
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 4. JS/CSS/fonts → Cache-First (Vite hashed filenames are immutable)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 5. Everything else → Network-First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
