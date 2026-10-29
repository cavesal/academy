/* CaVeSal® Academy — service worker
   Interfaz: precache. Guías (data/): red primero (4 s) y copia guardada si no hay conexión. */
var VERSION = 'cavesal-academy-v3';
var SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.json',
  'img/academy-portada.jpg', 'img/academy-logo.jpg', 'img/icon-192.png', 'img/icon-512.png',
  'img/apple-touch-icon.png', 'img/favicon.png', 'img/cavesal-emblema.png'];
var DATOS = ['data/version.json', 'data/hc.css', 'data/emergencias.css', 'data/emergencias-es.json', 'data/emergencias-en.json', 'data/emergencias-pt.json',
  'data/hc-es.json', 'data/hc-en.json', 'data/hc-pt.json',
  'data/biblio-hc-es.json', 'data/biblio-hc-en.json', 'data/biblio-hc-pt.json', 'data/biblio-emergencias-es.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(SHELL).then(function () { return Promise.all(DATOS.map(function (d) { return c.add(d).catch(function () {}); })); });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('cavesal-academy-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function redConTiempo(req, ms) {
  return new Promise(function (ok, mal) {
    var t = setTimeout(function () { mal(new Error('timeout')); }, ms);
    fetch(req, { cache: 'no-cache' }).then(function (r) { clearTimeout(t); ok(r); }, function (er) { clearTimeout(t); mal(er); });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin !== location.origin) return; // fuentes, verificación de licencia, buscadores externos
  if (u.pathname.indexOf('/data/') >= 0) {
    e.respondWith(redConTiempo(req, 4000).then(function (r) {
      if (r && r.ok) { var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); }
      return r;
    }).catch(function () { return caches.match(req).then(function (m) { return m || Response.error(); }); }));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (m) {
    var red = fetch(req).then(function (r) {
      if (r && r.ok) { var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); }
      return r;
    }).catch(function () { return m; });
    return m || red;
  }));
});
