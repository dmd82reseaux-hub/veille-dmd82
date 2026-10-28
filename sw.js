/* Service worker versionné : coquille de l'application en cache. Ne touche jamais aux appels Google (script.google.com). */
var VERSION = 'vdmd82-bacbdf2e11';
var COQUILLE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'css/app.css?v=bacbdf2e11', 'css/identite.css?v=bacbdf2e11', 'js/config.js?v=bacbdf2e11', 'js/schema.js?v=bacbdf2e11', 'js/demo-data.js?v=bacbdf2e11', 'js/util.js?v=bacbdf2e11', 'js/api.js?v=bacbdf2e11', 'js/store.js?v=bacbdf2e11', 'js/ui.js?v=bacbdf2e11', 'js/pages.js?v=bacbdf2e11', 'js/modules.js?v=bacbdf2e11', 'js/legifrance.js?v=bacbdf2e11', 'js/archives.js?v=bacbdf2e11', 'js/acces.js?v=bacbdf2e11', 'js/ecosysteme.js?v=bacbdf2e11', 'js/surveillance.js?v=bacbdf2e11', 'js/geopolitique.js?v=bacbdf2e11', 'js/tableau.js?v=bacbdf2e11', 'js/app.js?v=bacbdf2e11'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(COQUILLE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== VERSION; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // script.google.com et autres : jamais interceptés
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (r) { var c = r.clone(); caches.open(VERSION).then(function (x) { x.put('index.html', c); }); return r; }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request).then(function (res) { if (res.ok) { var c = res.clone(); caches.open(VERSION).then(function (x) { x.put(e.request, c); }); } return res; }); }));
});
