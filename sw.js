// Agro y Mercado — funciona sin señal en el stand.
const CACHE = "agro-v22";
const CORE = ["./", "index.html", "manifest.webmanifest", "favicon.png", "logo.png", "icon-192.png", "icon-512.png"];
// El juego y la página de cobertura: se guardan para usarlos sin señal (si alguno falla, no frena la instalación).
const JUEGO = ["juego/", "juego/juego.css", "juego/juego.js", "juego/ilustraciones.js", "juego/config.js",
  "juego/vendor/gsap.min.js", "juego/vendor/confetti.browser.js", "cobertura/"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => Promise.allSettled(JUEGO.concat(CDN).map(u => c.add(u))))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Red primero y, sin señal, lo último guardado bajo la clave indicada.
const redPrimero = (req, clave) => fetch(req).then(r => {
  if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(clave, c)); }
  return r;
}).catch(() => caches.match(clave));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // precios y estadísticas: siempre red primero, sin guardar
  if (/\/(api\/|datos\/|precios\.json|primas\.json|estadisticas\.json|agentes\.json)/.test(url.pathname)) return;
  // el panel de administración no se guarda ni se sirve sin conexión (lo protege Cloudflare Access)
  if (url.pathname.startsWith("/admin")) return;
  // cada página se guarda con su propia clave, así el juego no pisa a la página principal
  if (req.mode === "navigate") {
    const clave = url.pathname.startsWith("/juego") ? "juego/" : url.pathname.startsWith("/cobertura") ? "cobertura/" : "./";
    e.respondWith(redPrimero(req, clave));
    return;
  }
  // archivos del juego: red primero, para que los cambios se vean sin cambiar la versión
  if (url.origin === location.origin && url.pathname.startsWith("/juego/")) {
    e.respondWith(redPrimero(req, req));
    return;
  }
  // resto (íconos, librerías, tipografías): caché primero
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
