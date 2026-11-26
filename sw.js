const CACHE = 'facturas-v3';
const BASE = ['./', 'index.html', 'assets/logo.png', 'src/app.js', 'src/factura.js', 'src/pdf.js', 'src/emisor.js', 'src/almacen.js', 'src/logo.js', 'fonts/LiberationSans-Regular.ttf', 'fonts/LiberationSans-Bold.ttf', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
));

// Red primero, caché como respaldo (incluye pdfmake de cdnjs tras la primera visita).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    const copia = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copia));
    return r;
  }).catch(() => caches.match(e.request)));
});
