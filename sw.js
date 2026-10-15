// Estrategias Agro — funciona sin señal en el stand.
const CACHE = "agro-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => Promise.allSettled(CDN.map(u => c.add(u))))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // precios y estadísticas: siempre red primero, sin guardar
  if (/\/(api\/|precios\.json|estadisticas\.json)/.test(url.pathname)) return;
  // la página: red primero (para ver cambios), caché si no hay señal
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put("./", c)); return r; }).catch(() => caches.match("./")));
    return;
  }
  // resto (íconos, librerías, tipografías): caché primero
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
