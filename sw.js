/* Service worker versionné : coquille de l'application en cache. Ne touche jamais aux appels Google (script.google.com). */
var VERSION = 'vdmd82-99153c5e23';
var COQUILLE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'css/app.css?v=99153c5e23', 'css/identite.css?v=99153c5e23', 'js/config.js?v=99153c5e23', 'js/schema.js?v=99153c5e23', 'js/demo-data.js?v=99153c5e23', 'js/util.js?v=99153c5e23', 'js/api.js?v=99153c5e23', 'js/store.js?v=99153c5e23', 'js/ui.js?v=99153c5e23', 'js/pages.js?v=99153c5e23', 'js/modules.js?v=99153c5e23', 'js/legifrance.js?v=99153c5e23', 'js/archives.js?v=99153c5e23', 'js/acces.js?v=99153c5e23', 'js/ecosysteme.js?v=99153c5e23', 'js/surveillance.js?v=99153c5e23', 'js/geopolitique.js?v=99153c5e23', 'js/tableau.js?v=99153c5e23', 'js/app.js?v=99153c5e23'];
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
