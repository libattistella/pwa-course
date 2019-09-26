var CACHE_STATIC_NAME = 'static-v4';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);
  event.waitUntil(caches.open(CACHE_STATIC_NAME).then((cache) => {
    console.log('[Service Worker] Precaching app shell');
    // cache.add('/');
    // cache.add('/index.html');
    // cache.add('/src/js/app.js');

    // Put send the request and store data when the response is back
    cache.addAll([
      '/',
      '/index.html',
      '/src/js/app.js',
      '/src/js/feed.js',
      '/src/js/promise.js', // Not necessary because older browsers neither support sw
      '/src/js/fetch.js', // Not necessary because older browsers neither support sw
      '/src/js/material.min.js',
      '/src/css/app.css',
      '/src/css/feed.css',
      '/src/images/main-image.jpg',
      'https://fonts.googleapis.com/css?family=Roboto:400,700',
      'https://fonts.googleapis.com/icon?family=Material+Icons',
      'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
    ])
  })); // Esperamos que esta operación termine antes de seguir
});

// Sólo se activará cuando el usuario cierre todas las pestañas vinculadas a la app y la abra de nuevo
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);
  // Limpiamos las caches
  event.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
        console.log('[Service Worker] Removing old cache...', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim(); // Not necessary. Only makes it more robust
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((res) => {
    if (res) {
      return res;
    } else {
      return fetch(event.request).then((res) => {
        return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
          // Put only store data, I must provide the request and the response
          cache.put(event.request.url, res.clone());
          return res;
        });
      }).catch((err) => {

      });
    }
  }));
});