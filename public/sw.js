/* ------------------------------------------------------------------
 * Finova Service Worker
 * - Precaches the app shell (single-file build + icons + offline page)
 * - Navigation: network-first with offline fallback
 * - Static assets: cache-first
 * - Google Fonts: stale-while-revalidate
 * - Push notifications + notification click routing
 * - Background sync + skipWaiting update channel
 * ------------------------------------------------------------------ */

const VERSION = "finova-v1.0.0";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const FONT_CACHE = `${VERSION}-fonts`;
const CACHES = [SHELL_CACHE, STATIC_CACHE, FONT_CACHE];

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png",
];

// ---------------- Install: precache shell ----------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll is atomic — tolerate individual misses so install never fails
      await Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => null)
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ---------------- Activate: clean old caches ----------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !CACHES.includes(k)).map((k) => caches.delete(k))
      );
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (e) {
          /* noop */
        }
      }
      await self.clients.claim();
    })()
  );
});

// ---------------- Fetch strategies ----------------
const isFont = (url) =>
  url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

async function networkFirstNavigation(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      cache.put("./index.html", preload.clone()).catch(() => {});
      return preload;
    }
    const fresh = await fetch(event.request);
    cache.put("./index.html", fresh.clone()).catch(() => {});
    return fresh;
  } catch (e) {
    return (
      (await cache.match("./index.html")) ||
      (await cache.match("./")) ||
      (await cache.match("./offline.html")) ||
      new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const net = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache chrome-extension / devtools style schemes
  if (!url.protocol.startsWith("http")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

// ---------------- Push notifications ----------------
self.addEventListener("push", (event) => {
  let payload = {
    title: "Finova",
    body: "You have a new financial update.",
    tag: "finova-generic",
    page: "dashboard",
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: payload.tag,
      renotify: true,
      vibrate: [18, 60, 18],
      data: { page: payload.page || "dashboard", url: payload.url || "./" },
      actions: [
        { action: "open", title: "Open Finova" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const page = event.notification.data?.page || "dashboard";
  const target = new URL(`./?page=${page}&source=notification`, self.location.origin + self.location.pathname.replace(/sw\.js$/, "")).href;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          client.postMessage({ type: "NAVIGATE", page });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});

// ---------------- Background sync ----------------
self.addEventListener("sync", (event) => {
  if (event.tag === "finova-sync") {
    event.waitUntil(
      (async () => {
        const all = await self.clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) => c.postMessage({ type: "SYNC_COMPLETE", at: Date.now() }));
      })()
    );
  }
});

// ---------------- Periodic background sync ----------------
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "finova-refresh") {
    event.waitUntil(
      self.registration.showNotification("Finova digest ready", {
        body: "Your latest balances and portfolio movement are up to date.",
        icon: "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag: "finova-digest",
        data: { page: "dashboard" },
      })
    );
  }
});

// ---------------- Message channel ----------------
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "GET_VERSION") event.source?.postMessage({ type: "VERSION", version: VERSION });
  if (data.type === "CLEAR_CACHES") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        event.source?.postMessage({ type: "CACHES_CLEARED" });
      })()
    );
  }
  if (data.type === "SHOW_NOTIFICATION") {
    const n = data.payload || {};
    self.registration.showNotification(n.title || "Finova", {
      body: n.body || "",
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: n.tag || "finova-local",
      renotify: true,
      vibrate: [18, 60, 18],
      data: { page: n.page || "dashboard" },
      actions: [
        { action: "open", title: "Open Finova" },
        { action: "dismiss", title: "Dismiss" },
      ],
    });
  }
});
