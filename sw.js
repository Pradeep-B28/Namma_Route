// Simple Service Worker for Namma Route offline caching
const CACHE_NAME = 'namma-route-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './assets/favicon.png',
  './assets/logo.png',
  './js/data.js',
  './js/graph.js',
  './js/heap.js',
  './js/algorithms.js',
  './js/route.js',
  './js/render.js',
  './js/animate.js',
  './js/ui.js',
  './js/demo.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        // Fallback if offline
        return caches.match('./index.html');
      });
    })
  );
});
