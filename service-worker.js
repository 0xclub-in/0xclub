// service-worker.js – 0xClub PWA

const CACHE_NAME = '0xclub-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  './index.html',
  './styles.css',
  './main.js',
  './manifest.json',
  './icons/pwa_icon_192.png',
  './icons/pwa_icon_512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
