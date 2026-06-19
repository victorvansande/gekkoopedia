const CACHE = 'gekkoo-v32';
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
  './icon-512.png',
  './icon-maskable-512.png',
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

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  // Code (HTML/CSS/JS) altijd vers ophalen indien online, anders uit cache.
  const isCode = e.request.mode === 'navigate' || /\.(html|css|js)$/.test(url.pathname);

  if(sameOrigin && isCode){
    e.respondWith(
      fetch(e.request).then(resp => {
        if(resp && resp.status === 200){
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() =>
        caches.match(e.request).then(cached =>
          cached || (e.request.mode === 'navigate' ? caches.match('./index.html') : null) || new Response('Offline', {status: 503})
        )
      )
    );
    return;
  }

  // Statische assets (afbeeldingen, fonts, pdf's): cache-first met stille achtergrond-update.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type !== 'opaque'){
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached || new Response('Offline', {status: 503}));
      return cached || net;
    })
  );
});
