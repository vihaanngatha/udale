/* Uda le service worker: offline cache + reminder notifications */
const CACHE = "udale-v6";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // fonts: cache first
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // app files: network first so updates land, cache when offline
  e.respondWith(fetch(req).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
});

const DAILY = [
  "Log today's spending. Hiding something?",
  "Whatever you blew, write it down. Now.",
  "Log it. You won't remember tomorrow, and we both know it.",
  "Day's over. How much did you blow?"
];
const WEEKLY = [
  "Your weekly review is ready. No running.",
  "Week's up. Open your UPI app and face it."
];
self.addEventListener("push", e => {
  let kind = null;
  try { const d = e.data && e.data.json(); kind = d && d.kind; } catch (_) {}
  if (!kind) { // payload-less push: decide by local time
    const n = new Date();
    kind = (n.getDay() === 0 && n.getHours() >= 19) ? "weekly" : "daily";
  }
  const list = kind === "weekly" ? WEEKLY : kind === "test" ? ["Test. Reminders are working."] : DAILY;
  const body = list[Math.floor(Math.random() * list.length)];
  e.waitUntil(self.registration.showNotification("Uda le", { body, icon: "icon-192.png", badge: "icon-192.png", tag: "udale-" + kind }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
