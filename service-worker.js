// ============================================================
// Vanessa Velasco Studio - Service Worker
// ============================================================

const CACHE_NAME = 'vvs-studio-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar — cachear assets principales
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, caché como fallback
self.addEventListener('fetch', function(e) {
  // No interceptar peticiones al Apps Script
  if (e.request.url.indexOf('script.google.com') !== -1) return;
  if (e.request.url.indexOf('googleapis.com') !== -1) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Cachear respuestas exitosas de assets propios
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Sin red — servir desde caché
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
