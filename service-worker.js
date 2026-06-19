const CACHE = 'gekkoo-v29';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './game.js',
  './game2.js',
  './game3.js',
  './regio.js',
  './ProvidenceSansPro.otf',
  './favicon.svg',
  './manifest.json',
  './annelies.jpg',
  './loes.jpg',
  './og-image.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type !== 'opaque'){
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => cached || new Response('Offline', {status: 503}));
      return cached || net;
    })
  );
});
